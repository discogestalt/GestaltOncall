<?php

header('content-type: application/json');
header('Access-Control-Allow-Origin: http://wiki.leanlogistics.com');

error_reporting(E_ERROR|E_PARSE);
$expectedTables = array("caldays","calendar","edits","groupmap","groups","victims");
if(file_exists("../../.config")) {
  $returnData['cfile']=1;
  if( !$config = parse_ini_file("../../.config")) {
		$errors = error_get_last();
		$returnData['db'] = 0;
		$returnData['error_msg'] = "Unable to read config: " . $errors['message'];
	} else {
		$dbConn = mysqli_init();
		mysqli_real_connect($dbConn, $config['host'], $config['user'], $config['password'], $config['db']);
		if(mysqli_connect_error()) {
			$returnData['db']=0;
			$returnData['error_msg']=mysqli_connect_error();
		} else {
			$returnData['db']=1;
			$tableList = mysqli_query($dbConn, "show tables");
			if(!$tableList) {
				$returnData['tables']=0;
			} else {
				$returnData['tables']=mysqli_num_rows($tableList);
				while($row = mysqli_fetch_array($tableList)) {
					$dbTable[$row[0]] = 1;
				}
				foreach($expectedTables as $t) {
					if(!$dbTable[$t]) {
						$returnData[$t]=0;
					} else {
						$returnData[$t]=1;
					}
				}
			}
			mysqli_close($dbConn);
		}
	}
} else {
	$returnData['cfile']=0;
}

print json_encode($returnData) . "\n";

?>
