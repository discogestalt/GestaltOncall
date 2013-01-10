<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

#$changes = $_POST;
$endYear = $_GET['end'];

$config = parse_ini_file("../../.config");

$curQuery = "SELECT * from caldays where id=(select max(id) from caldays)";
$dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
mysqli_select_db($dbConn, $config['db']) or die("Unable to select database " . $config['db'] . "\n");
$currEnd = mysqli_query($dbConn, $curQuery) or die("Select failed: " . mysqli_error($dbConn) . "\n");
if(mysqli_num_rows($currEnd)<1) {
  die("Query returned no results\n");
} else {
  while($row = mysqli_fetch_assoc($currEnd)) {
    $y = $row['year'];
    $m = $row['month'];
    $d = $row['day'];
  }
}

$TZ = new DateTimeZone('America/Detroit');
$start = new DateTime($y . '-' . $m . '-' . $d, $TZ);
$end = new DateTime($endYear . '-12-31', $TZ);

while($start < $end) {
  $start->add(new DateInterval('P1D'));
  $q = "INSERT INTO caldays (year,month,day) VALUES(" . $start->format('Y') . "," . $start->format('m') . "," . $start->format('d') . ")";
  mysqli_query($dbConn,$q) or die("Insert failed: " . mysqli_error($dbConn) . "\n");
}

mysqli_close($dbConn);
?>
