<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

function getGroupMap() {
  global $config;
  $gQuery = "SELECT g.groupid, v.firstname from groupmap g, victims v where g.userid=v.id and g.active=1 order by g.groupid";
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $gQuery);
  mysqli_close($dbConn);

  while($row = mysqli_fetch_row($query_result)) {
    $returnData[$row[0]][] = $row[1];
  }

  print json_encode($returnData) . "\n";
}


getGroupMap();

?>
