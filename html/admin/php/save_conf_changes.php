<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

$changes = $_POST;
$cfgtmp = "/var/tmp/cfgtmp." . $_SERVER['REMOTE_PORT'] . "." . $_SERVER['REQUEST_TIME'];
$fh = fopen($cfgtmp, "w");
$config="../../.config";
copy($config,$config . ".bak");

foreach($changes as $key => $cObj) {
  $section = $key;
  fwrite($fh, "[" . $section . "]\n");
  foreach($cObj as $c => $v) {
    fwrite($fh, $c . " = \"" . $v . "\"\n");
  }
}
fclose($fh);
copy($cfgtmp,$config);
?>
