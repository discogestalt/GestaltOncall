<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$col = $_GET["col"];
$val = $_GET["value"];

function getVictim($col,$val) {
  global $config;
  $dbQuery = "SELECT * from victims where " . $col . "='" . $val . "'";
  $dbConn = mysqli_connect($config['host'], $config['user'], $config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $dbQuery);
  mysqli_close($dbConn);

  if(mysqli_num_rows($query_result) > 0) {
    while($row = mysqli_fetch_assoc($query_result)) {
      $returnData['id']=$row['id'];
      $returnData['username']=$row['username'];
      $returnData['firstname']=$row['firstname'];
      $returnData['lastname']=$row['lastname'];
      $returnData['phone']=$row['phone'];
      $returnData['sms_email']=$row['sms_email'];
      $returnData['active']=$row['active'];
    }
  } else {
    $returnData['id']="Not Found";
  }

  print json_encode($returnData) . "\n";
}

getVictim($col,$val);

?>
