<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$changes = $_POST;

function updateGroupMembers($changes) {
  global $config;
  foreach($changes as $cObj) {
    $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
    mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
    $cObj=json_decode($cObj,true);
    $userid = key($changes);
    if($cObj['type']=="update") {
      if($cObj['dbUpString']!="") {
	$qString = "UPDATE " . $cObj['table'] . " SET " . $cObj['dbUpString'] . " WHERE " . $cObj['where'];
	mysqli_query($dbConn, $qString) or die("Update of " . $cObj['table'] . " failed: " . mysqli_error($dbConn). "\n");
      }
      if(isset($cObj['active'])) {
	$gmQuery = "UPDATE groupmap SET active='" . $cObj['active'] . "' WHERE userid='" . $cObj['userid'] . "' AND groupid='" . $cObj['group'] . "'";
	mysqli_query($dbConn, $gmQuery) or die("Update of groupmap failed: " . mysqli_error($dbConn) . "\n");
      } else {
	die("not changing active status\n");
      }
    } else if($cObj['type']=="insert") {
      if($cObj['table']=="victims") {
	$qStringV = "INSERT INTO victims VALUES(''," . $cObj['dbUpString'] . ")";
	$qStringG = "INSERT INTO groupmap (groupid, userid, active) VALUES ('" . $cObj['group'] . "', LAST_INSERT_ID(),'" . $cObj['active'] . "')";
	mysqli_query($dbConn, "BEGIN") or die("Can't begin the transaction: " . mysqli_error($dbConn) . "\n");
	mysqli_query($dbConn, $qStringV) or die("Insert into victims failed: " . mysqli_error($dbConn) . "\n");
	mysqli_query($dbConn, $qStringG) or die("Insert into groupmap failed: " . mysqli_error($dbConn) . "\n");
	mysqli_query($dbConn, "COMMIT") or die("Commit failed: " . mysqli_error($dbConn) . "\n");
      } else if($cObj['table']=="groupmap") {
	$qString = "INSERT INTO " . $cObj['table'] . " values(''," . $cObj['dbUpString'] . "," . $cObj['active'] .  ")";
	mysqli_query($dbConn, $qString) or die("Insert into " . $cObj['table'] . " failed: " . mysqli_error($dbConn) . "\n"); 
      }
    } else if($cObj['type']=="delete") {
      $qString = "DELETE FROM " . $cObj['table'] . " WHERE " . $cObj['dbUpString'];
      mysqli_query($dbConn, $qString) or die("Delete from " . $cObj['table'] . " failed: " . mysqli_error($dbConn) . "\n");
    }
    next($changes);
  }
  mysqli_close($dbConn);
}


updateGroupMembers($changes);

?>
