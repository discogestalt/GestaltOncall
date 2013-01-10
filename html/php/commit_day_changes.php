<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$changes = $_POST;

function updateDaySlots($changes) {
  global $config;
  $gid = array_shift($changes);
  $day = array_shift($changes);
  $month = array_shift($changes);
  $year = array_shift($changes);
  $dbConn = mysqli_connect($config['host'], $config['user'], $config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $preQuery = "SELECT * FROM calendar WHERE calday = (SELECT id FROM caldays WHERE year=$year AND month=$month AND day=$day) and groupid=$gid";
  $current_victims = mysqli_query($dbConn, $preQuery);
  while($row = mysqli_fetch_assoc($current_victims)) {
    if(isset($calDay)) {
    } else {
      $calDay = $row['calday'];
    }
    if($row['hour'] < 10) {
      $cHour = "0" . $row['hour'];
    } else {
      $cHour = $row['hour'];
    }
    if($row['min'] < 10) {
      $cMin = "0" . $row['min'];
    } else {
      $cMin = $row['min'];
    }
    $currSlot = $cHour . ":" . $cMin;
    if(isset($changes[$currSlot])) {
      if($row['victimid'] != $changes[$currSlot]) {
	mysqli_query($dbConn, "UPDATE calendar set victimid=" . $changes[$currSlot] . " where calday = (SELECT id FROM caldays WHERE year=$year AND month=$month AND day=$day) AND hour=" . $row['hour'] . " AND min=" . $row['min'] . " AND groupid=$gid");
      } else if($row['victim'] == null) {
	mysqli_query($dbConn, "INSERT INTO calendar values((SELECT id FROM calays WHERE year=$year AND month=$month AND day=$day)," . $row['hour'] . "," . $row['min'] . ",$gid," . $changes[$currSlot]);
      }
    }
  }
  mysqli_close($dbConn);
}


updateDaySlots($changes);

?>
