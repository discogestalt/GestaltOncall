<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

function getGroupList() {
  global $config;
  $gQuery = "SELECT * from groups where active=1";
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  @mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $gQuery);
  mysqli_close($dbConn);

  while($row = mysqli_fetch_assoc($query_result)) {
    $returnData[$row['id']] = $row;
  }

  print json_encode($returnData) . "\n";
}


getGroupList();

?>
