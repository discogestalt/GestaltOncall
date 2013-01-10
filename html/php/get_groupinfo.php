<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$gid = $_GET["g"];

function getGroupName($gid) {
  global $config;
  $gQuery = "SELECT name, turnover_hour, turnover_min from groups where id=$gid";
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $gQuery);
  mysqli_close($dbConn);

  $result = mysqli_fetch_row($query_result);
  $returnData['name'] = $result[0];
  $returnData['t_hour'] = $result[1];
  $returnData['t_min'] = $result[2];

  print json_encode($returnData) . "\n";
}


getGroupName($gid);

?>
