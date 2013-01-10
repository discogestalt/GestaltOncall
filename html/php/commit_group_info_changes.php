<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$changes = $_POST;

function updateGroupInfo($changes) {
  global $config;
  $gid = array_shift($changes);
  $updates = array_shift($changes);
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  mysqli_query($dbConn, "UPDATE groups SET $updates WHERE id=$gid") or die("Group info update failed");
  mysqli_close($dbConn);
}


updateGroupInfo($changes);

?>
