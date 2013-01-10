<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$gid = $_GET["gid"];

$config = parse_ini_file("../../.config");

$dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
mysqli_select_db($dbConn, $config['db']) or die("Unable to select database " . $config['db'] . "\n");
mysqli_query($dbConn,"DELETE from groups where id=" . $gid) or die("Delete failed: " . mysqli_error($dbConn) . "\n");
mysqli_close($dbConn);

?>
