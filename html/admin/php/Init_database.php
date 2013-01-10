<?php

header('content-type: application/json');

$table = $_GET['table'];
$action = $_GET['do'];
$admin_user = $_GET['user'];
$admin_passwd = $_GET['passwd'];

if( !isset($action) ) {
	die("Insufficient information given, unable to continue");
}

$config = parse_ini_file("../../.config");
$dbConn = mysqli_init();

$expectedTables = array();
$expectedTables['caldays'] = array("id int(4) NOT NULL auto_increment,","year int(4) default NULL,","month int(4) default NULL,","day int(4) default NULL,","PRIMARY KEY (id)");
$expectedTables['calendar'] = array("calday int(4) default NULL,","hour int(2) default NULL,","min int(2) default NULL,","groupid int(4) default NULL,","victimid int(4) default NULL");
$expectedTables['edits'] = array("ts timestamp NOT NULL default '0000-00-00 00:00:00' on update CURRENT_TIMESTAMP,","updaterid int(4) default NULL,","updated_group int(4) default NULL,","update_note varchar(1024) default NULL");
$expectedTables['groupmap'] = array("id int(4) unsigned NOT NULL auto_increment,","groupid int(4) default NULL,","userid int(4) default NULL,","active int(4) default NULL,","PRIMARY KEY (id)");
$expectedTables['groups'] = array("id int(4) NOT NULL auto_increment,","name varchar(128) default NULL,","active tinyint(1) default '0',","autorotate tinyint(1) default '0',","turnover_hour int(4) default '9',","turnover_min int(4) default '30',","oncallid int(4) default NULL,","backup tinyint(1) default NULL,","backupid int(4) default NULL,","failsafe tinyint(1) default NULL,","alias varchar(36) default NULL,","backup_alias varchar(36) default NULL,","failsafe_alias varchar(36) default NULL,","email varchar(128) default NULL,","PRIMARY KEY (id)");
$expectedTables['victims'] = array("id int(4) NOT NULL auto_increment,","username varchar(32) default NULL,","firstname varchar(32) default NULL,","lastname varchar(32) default NULL,","phone varchar(32) default NULL,","active tinyint(1) default '0',","sms_email varchar(40) default NULL,","PRIMARY KEY (id)");

function Drop_table($dtable, $action) {
	global $dbConn, $expectedTables, $info_data;
	if( !isset($expectedTables[$dtable]) ) {
		print "Table " . $dtable . " is not valid for this application\n";
		exit();
	} else {
		$drop_query = "DROP TABLE IF EXISTS $dtable";
	}
	switch($action) {
		case execute:
			mysqli_query($dbConn, $drop_query) or die("DROP of table " . $dtable . " failed, " . mysqli_error($dbConn) . "\n");

		case info:
			$info_data[$dtable] = array();
			$info_data[$dtable]['drop'] = array($drop_query);
	}
}

function Create_table($ctable, $action) {
	global $dbConn, $expectedTables, $info_data;

	if( !isset($expectedTables[$ctable]) ) {
		print "Table " . $ctable . " is not valid for this application\n";
		exit();
	} else {
		$create_query = "CREATE TABLE " . $ctable . " (";
	}
	switch($action) {
		case execute:
			$create_query .= implode("\n",$expectedTables[$ctable]);
			$create_query .= "\n) ENGINE=InnoDB DEFAULT CHARSET=latin1";
			mysqli_query($dbConn, $create_query) or die("CREATE table " . $ctable . " failed: " . mysqli_error($dbConn) . "\n");

		case info:
			$info_data[$ctable]['create'] = array($create_query);
			foreach($expectedTables[$ctable] as $create_line) {
				array_push($info_data[$ctable]['create'],$create_line);
			}
			array_push($info_data[$ctable]['create'], ") ENGINE=InnoDB DEFAULT CHARSET=latin1;");
	}
}

function Create_db($db) {

}

switch($action) {
	case execute:
		mysqli_real_connect($dbConn,$config['host'],$config['user'],$config['password']) or die("Unable to connect to database server: " . mysqli_error($dbConn) . "\n");
		mysqli_select_db($dbConn, $config['db']) or die("Unable to connect to database: " . mysqli_error($dbConn) . "\n");
		Drop_table($table, $action);
		Create_table($table, $action);
		mysqli_close($dbConn);
		exit();

	case initdb:
		$initdb_query = "CREATE DATABASE " . $config['db'];
		mysqli_real_connect($dbConn,$config['host'],$admin_user,$admin_passwd) or die("Unable to connect to database server: " . mysqli_error($dbConn) . "\n");
		mysqli_query($dbConn, $initdb_query) or die("Unable to create database: " . mysqli_error($dbConn)  . "\n");
		mysqli_close($dbConn);
		exit();

	case add_user:
		$add_user_query = "GRANT ALL on " . $config['db'] . ".* to '" . $config['user'] . "'@'" . $config['ajax_host'] . "' IDENTIFIED BY '" . $config['password'] . "'";
		mysqli_real_connect($dbConn,$config['host'],$admin_user,$admin_passwd) or die("Unable to connect to database server: " . mysqli_error($dbConn) . "\n");
		mysqli_query($dbConn, $add_user_query) or die("Unable to add user: " . mysqli_error($dbConn) . "\n");
		mysqli_close($dbConn);
		exit();

	case info:
		$info_data = array();
	  if($table=="all") {
			foreach(array_keys($expectedTables) as $etable) {
				Drop_table($etable, $action);
				Create_table($etable, $action);
			}
		} else {
			Drop_table($table, $action);
			Create_table($table, $action);
		}
		print json_encode($info_data) . "\n";
}


?>
