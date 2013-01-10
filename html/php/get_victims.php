<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

$year = $_GET["year"];
$month = $_GET["month"];
if(isset($_GET["day"])) {
  $day = $_GET["day"];
}
if(isset($_GET["g"])) {
  $gid = $_GET["g"];
}
if(isset($_GET["p"])) {
  $period = $_GET["p"];
}

function getVictims($query,$period) {
  global $config;
  $dbConn = mysqli_connect($config['host'],$config['user'],$config['password']) or die("Unable to connect to database");
  mysqli_select_db($dbConn, $config['db']) or die("Unable to select database oncallv2");
  $query_result = mysqli_query($dbConn, $query);
  $numRows = mysqli_num_rows($query_result);
  mysqli_close($dbConn);

  while($row = mysqli_fetch_assoc($query_result)) {
    $date = sprintf('%02d',$row['day']);
    $slot = sprintf('%02d',$row['hour']) . ":" . sprintf('%02d',$row['min']);
    if($period=="day") {
      $returnData[$slot] = $row['firstname'];
    } else {
      if($day[$row['gid']] != $row['calday']) {
	$day[$row['gid']] = $row['calday'];
	$returnData[$row['calday']][] = array($date,$slot,$row['gid'],$row['firstname']);
	$currentVictim[$row['gid']] = $row['firstname'];
      } else if($currentVictim[$row['gid']] != $row['firstname']) {
	$returnData[$row['calday']][] = array($date,$slot,$row['gid'],$row['firstname']);
	$currentVictim[$row['gid']] = $row['firstname'];
      }
    }
  }

  print json_encode($returnData) . "\n";
}

function buildQuery() {
  global $year, $month, $day, $period, $gid;

  $dbQuery = "SELECT d.id as calday, d.year, d.month, d.day, c.hour, c.min, g.id as gid, v.firstname FROM caldays d, calendar c, groups g, victims v WHERE c.calday IN (SELECT id FROM caldays WHERE year=$year AND month=$month";

  if(isset($period)) {
    if($period=="pre") {
      $dbQuery .= " AND day >= $day)";
    } else if($period=="post") {
      $dbQuery .= " AND day <= $day)";
    } else if($period=="day") {
      $dbQuery .= " AND day = $day)";
    }
  } else {
    $dbQuery .= ") ";
  }
  if(isset($gid)) {
    if($period=="month") {
      $dbQuery .= ") AND c.hour=(SELECT turnover_hour from groups where id=$gid) and c.min=(SELECT turnover_min from groups where id=$gid) AND c.groupid=$gid AND d.id=c.calday AND c.victimid=v.id and g.id=c.groupid ORDER BY d.day, c.hour, c.min";
    } else {
      $dbQuery .= "AND c.groupid=$gid AND c.victimid=v.id AND d.id=c.calday AND g.id=c.groupid ORDER BY d.day, c.hour, c.min, g.id";
    }
  } else {
    $dbQuery .= "AND c.victimid=v.id AND d.id=c.calday AND g.id=c.groupid ORDER BY d.day, c.hour, c.min, g.id";
  }

  getVictims($dbQuery,$period);

}

buildQuery();

?>
