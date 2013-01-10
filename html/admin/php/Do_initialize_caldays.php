<?php

header('content-type: application/json');

$start_month = $_GET['start_month'];
$start_year = $_GET['start_year'];
$end_year = $_GET['init_cal_end'];

$config = parse_ini_file("../../.config");

if(!isset($start_month) || !isset($start_year) || !isset($end_year)) {
	die("Initialization incomplete\n");
}

$curQuery = "SELECT * from caldays where id=(select max(id) from caldays)";
$dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
mysqli_select_db($dbConn, $config['db']) or die("Unable to select database " . $config['db'] . "\n");
$currEnd = mysqli_query($dbConn, $curQuery) or die("Select failed: " . mysqli_error($dbConn) . "\n");
if(mysqli_num_rows($currEnd)>0) {
  die("Calendar database contains data, initialization aborted\n");
} else {

	$TZ = new DateTimeZone('America/Los_Angeles');
	$start = new DateTime($start_year . '-' . $start_month . '-01', $TZ);
	$end = new DateTime($end_year . '-12-31', $TZ);

	while($start <= $end) {
		$q = "INSERT INTO caldays (year,month,day) VALUES(" . $start->format('Y') . "," . $start->format('m') . "," . $start->format('d') . ")";
		mysqli_query($dbConn,$q) or die("Insert failed: " . mysqli_error($dbConn) . "\n");
		$start->add(new DateInterval('P1D'));
	}
}

mysqli_close($dbConn);

?>
