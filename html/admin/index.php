<html>
  <head>
    <title>On-Call Calendar Administration</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="stylesheet" href="/css/common.css" type="text/css" media="screen" charset="utf-8" />
    <link rel="stylesheet" href="/admin/css/admin.css" type="text/css" media="screen" charset="utf-8" />
    <link rel="stylesheet" href="/admin/css/locc-admin/jquery-ui-1.9.2.custom.css" type="text/css" media="screen" charset="utf-8" />
  </head>

  <body>
    <script src="../js/jquery.js" type="text/javascript"></script>
    <script src="js/jquery-ui-1.9.2.custom.js" type="text/javascript"></script>
    <script src="js/caladmin.js" type="text/javascript"></script>
    <script type="text/javascript">
<?php
  if(file_exists("../.config")) {
    $cfile = parse_ini_file("../.config",true);
    print "var config = {\n";
    foreach($cfile['javascript_config'] as $k => $v) {
      print "$k: \"$v\",\n";
    }
    print "}\n";
  }
?>
      $(document).ready(function() {
	Calendar_admin = new OnCall_Calendar_Admin("Calendar_admin")
      } );
    </script>

    <div id="caladmin_container">
      <div id="db_create"></div>
      <div id="admin_console"></div>
    </div> <!-- end div container -->

  </body>

</html>
