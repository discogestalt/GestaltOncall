<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$config = parse_ini_file("../../.config",true,INI_SCANNER_RAW);

foreach($config as $c => $v) {
  if($c!="ignore") {
    $returnData[$c]=$v;
  }
}

print json_encode($returnData) . "\n";

?>
