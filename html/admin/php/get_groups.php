<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$config = parse_ini_file("../../.config");

function getGroupList() {
  global $config;
  $gQuery = "SELECT * from groups";
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $gQuery);
  mysqli_close($dbConn);

  if(mysqli_num_rows($query_result) < 1) {
    $returnData[1]="empty";
  } else {
    while($row = mysqli_fetch_assoc($query_result)) {
      $returnData[$row['id']] = $row;
    }
  }

  print json_encode($returnData) . "\n";
}


getGroupList();

?>
