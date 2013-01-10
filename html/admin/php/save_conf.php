<?php

header('content-type: application/json');

$configdata = $_POST;
$cfgtmp = "/var/tmp/cfgtmp." . $_SERVER['REMOTE_PORT'] . "." . $_SERVER['REQUEST_TIME'];
$fh = fopen($cfgtmp, "w");
$config="../../.config";

fwrite($fh, "[database_config]\n");
fwrite($fh, "host = " . $configdata["host"] . "\n");
fwrite($fh, "user = " . $configdata["user"] . "\n");
fwrite($fh, "password = " . $configdata["password"] . "\n");
fwrite($fh, "db = " . $configdata["db"] . "\n");
fwrite($fh, "\n[javascript_config]\n");
fwrite($fh, "embed = " . $configdata["embedded"] . "\n");
fwrite($fh, "embed_host = " . $configdata["embed_host"] . "\n");
fwrite($fh, "ajax_host = " . $configdata["ajax_host"] . "\n");
fclose($fh);
if( !copy($cfgtmp,$config)) {
	$errors = error_get_last();
	die("Copy of config file failed: " . $errors['message']);
}
?>
