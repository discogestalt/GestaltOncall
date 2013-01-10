<?php

header('content-type: application/json');

$config = parse_ini_file("../.config");
if($config['embed']=="Yes") {
	header('Access-Control-Allow-Origin: http://' . $config['embed_host']);
}

foreach($config as $c => $v) {
  $returnData[$c]=$v;
}

print json_encode($returnData) . "\n";

?>
