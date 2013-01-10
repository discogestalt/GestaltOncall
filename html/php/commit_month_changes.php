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
  $tSlot = array_shift($changes);
  list($tHour,$tMin) = explode(":", $tSlot);
  $slotMaster = array();
  $slotMaster[] = $tSlot;
  if($tMin < 1) {
    $slotMaster[] = $tHour . ":30";
  }
  $h = $tHour+1;
  while($h <= 23) {
    $slotMaster[] = $h . ":0";
    $slotMaster[] = $h . ":30";
    $h++;
  }
  $h = 0;
  while($h < $tHour) {
    $rSlotMaster[] = $h . ":0";
    $rSlotMaster[] = $h . ":30";
    $h++;
  }
  if($tMin > 0) {
    $rSlotMaster[] = $tHour . ":0";
  }
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  foreach($changes as $ck => $cv) {
    list($day,$month,$year) = explode('-',$ck);
    $month++;
    $nextDay = date("d-m-Y", mktime(0, 0, 0, $month, $day+1, $year));
    list($rDay, $rMonth, $rYear) = explode('-',$nextDay);
    if($cv == '--') {
      continue;
    }
    $cdQuery = "SELECT id from caldays WHERE year=$year AND month=$month and day=$day";
    $rCdQuery = "SELECT id from caldays WHERE year=$rYear AND month=$rMonth and day=$rDay";
    $cData=mysqli_query($dbConn, $cdQuery);
    $cResult = mysqli_fetch_row($cData);
    $calDay = $cResult[0];
    $rCData = mysqli_query($dbConn, $rCdQuery);
    $rCResult = mysqli_fetch_row($rCData);
    $rCalDay = $rCResult[0];
    if($tMin > 0) {
      $turnQuery = "SELECT * FROM calendar WHERE calday=$calDay AND groupid=$gid AND hour=$tHour AND min=$tMin";
      $tData = mysqli_query($dbConn, $turnQuery);
      if(mysqli_num_rows($tData) > 0) {
	$tResult = mysqli_fetch_row($tData);
	$slot = $tResult[1] . ":" . $tResult[2];
	$slotData[$slot] = $tResult[4];
      }
      $preQuery = "SELECT * FROM calendar WHERE calday=$calDay AND groupid=$gid AND hour>$tHour";
    } else {
      $preQuery = "SELECT * FROM calendar WHERE calday=$calDay AND groupid=$gid AND hour>=$tHour";
    }
    $currentData = mysqli_query($dbConn, $preQuery);
    if(mysqli_num_rows($currentData) > 0) {
      while($row = mysqli_fetch_assoc($currentData)) {
	$slot = $row['hour'] . ":" . $row['min'];
	$slotData[$slot] = $row['victimid'];
      }
    }
    $rollQuery = "SELECT * FROM calendar WHERE calday=$rCalDay AND groupid=$gid AND hour < $tHour";
    $rollData = mysqli_query($dbConn, $rollQuery);
    if(mysqli_num_rows($rollData) > 0) {
      while($row = mysqli_fetch_assoc($rollData)) {
	$slot = $row['hour'] . ":" . $row['min'];
	$slotData[$slot] = $row['victimid'];
      }
    }
    if($tMin > 0) {
      $rtQuery = "SELECT * FROM calendar WHERE calday=$rCalDay and groupid=$gid AND hour=$tHour and min=0";
      $rtData = mysqli_query($dbConn, $rtQuery);
      $rtResult = mysqli_fetch_row($rtData);
      $slot = $rtResult[1] . ":" . $rtResult[2];
      $slotData[$slot] = $rtResult[4];
    }
    foreach($slotMaster as $s) {
      list($sH,$sM) = explode(":",$s);
      if(isset($slotData[$s])) {
	if($slotData[$s] == null) {
	  mysqli_query($dbConn, "INSERT INTO calendar values($calDay,$sH,$sM,$gid,$cv)");
	} else if($slotData[$s] != $cv) {
	  mysqli_query($dbConn, "UPDATE calendar set victimid=$cv WHERE calday=$calDay AND hour=$sH AND min=$sM AND groupid=$gid");
	}
      } else {
	mysqli_query($dbConn, "INSERT INTO calendar values($calDay,$sH,$sM,$gid,$cv)");
      }
    }
    foreach($rSlotMaster as $r) {
      list($rH,$rM) = explode(":",$r);
      if(isset($slotData[$r])) {
	if($slotData[$r] == null) {
	  mysqli_query($dbConn, "INSERT INTO calendar values($rCalDay,$rH,$rM,$gid,$cv)");
	} else if($slotData[$r] != $cv) {
	  mysqli_query($dbConn, "UPDATE calendar set victimid=$cv WHERE calday=$rCalDay AND hour=$rH AND min=$rM AND groupid=$gid");
	}
      } else {
	mysqli_query($dbConn, "INSERT INTO calendar values($rCalDay,$rH,$rM,$gid,$cv)");
      }
    }
  }
  mysqli_close($dbConn);
}


updateDaySlots($changes);

?>
