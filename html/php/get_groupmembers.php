<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$gid = $_GET["g"];

function getGroupMembers($gid) {
  global $config;
  $gQuery = "SELECT v.id, v.username, v.firstname, v.lastname, v.phone, g.active, v.sms_email from victims v, groupmap g where v.id=g.userid and groupid=$gid";
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $gQuery) or die("Group Member select failed: " . mysqli_error($dbConn) . "\n");
  mysqli_close($dbConn);

  while($row = mysqli_fetch_assoc($query_result)) {
    $vicArray = array($row['firstname'], $row['lastname'], $row['username'], $row['phone'], $row['active'], $row['sms_email']);
    $returnData[$row['id']] = $vicArray;
  }

  print json_encode($returnData) . "\n";
}


getGroupMembers($gid);

?>
