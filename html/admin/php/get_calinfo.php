<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$config = parse_ini_file("../../.config");

$gQuery = "SELECT * from caldays where id=(select max(id) from caldays)";
$dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
$query_result = mysqli_query($dbConn, $gQuery);
mysqli_close($dbConn);

if(mysqli_num_rows($query_result) < 1) {
  $returnData[1] = "empty";
} else {
  while($row = mysqli_fetch_assoc($query_result)) {
    $returnData = $row;
  }
}

print json_encode($returnData) . "\n";

?>
