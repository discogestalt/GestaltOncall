<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$changes = $_POST;

$config = parse_ini_file("../../.config");

$dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
mysqli_select_db($dbConn, $config['db']) or die("Unable to select database " . $config['db'] . "\n");
mysqli_query($dbConn,"INSERT INTO groups VALUES('','" . $changes['group_name'] . "','" . (!$changes['group_active']?0:1) . "','" . (!$changes['group_autorotate']?0:1) . "','" . $changes['group_turn_hour'] . "','" . $changes['group_turn_min'] . "','','" . (!$changes['group_backup']?0:1) . "','','" . (!$changes['group_panic']?0:1) . "','" . $changes['group_oncall_email'] . "','" . $changes['group_backup_email'] . "','" . $changes['group_panic_email'] . "','" . $changes['group_email'] . "')") or die("INSERT failed " . mysqli_error($dbConn) . "\n");
mysqli_close($dbConn);

?>
