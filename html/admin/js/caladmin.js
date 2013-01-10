function OnCall_Calendar_Admin(name) {

	this.name = name

	// Make the methods accessible
	this.check_db_config=check_db_config
	this.get_db_config_status=get_db_config_status
	this.create_config=create_config
	this.get_create_db=get_create_db
	this.save_new_config=save_new_config
	this.initialize_caldays=initialize_caldays
	this.do_initialize_caldays=do_initialize_caldays
	this.display_admin_console=display_admin_console
	this.build_config_tab=build_config_tab
	this.get_config_info=get_config_info
	this.edit_config=edit_config
	this.save_config_edits=save_config_edits
	this.get_group_info=get_group_info
	this.add_new_group=add_new_group
	this.edit_groups=edit_groups
	this.delete_group=delete_group
	this.save_add_group=save_add_group
	this.get_user_info=get_user_info
	this.delete_user=delete_user
	this.get_calendar_info=get_calendar_info
	this.extend_calendar=extend_calendar

	var basic_boolean = new Array("No","Yes")
	var cal_months =
	{
		01: 'January'
		,02: 'February'
		,03: 'March'
		,04: 'April'
		,05: 'May'
		,06: 'June'
		,07: 'July'
		,08: 'August'
		,09: 'September'
		,10: 'October'
		,11: 'November'
		,12: 'December'
	}

	check_db_config()

	// check_db_config
	// Checks for the existence of the .config file,
	// then for the existence of the configured database,
	// then for the existence of the required tables
	function check_db_config() {
		var console_object=this
		console_object.confResult=get_db_config_status()
		if(console_object.confResult.cfile < 1) {
			create_config()
		} else if(console_object.confResult.db < 1) {
			var check_cfg_promise = get_config_info()
			check_cfg_promise.done(function(data) {
				console_object.config_data = data
				get_create_db()
			})
		} else if(console_object.confResult.tables < 6) {
			var check_cfg_promise = get_config_info()
			check_cfg_promise.done(function(data) {
				console_object.config_data = data
				get_create_db()
			})
		} else {
			display_admin_console()
		}
	}

  // create_config
	// Function to open dialog and prompt user for
	// configuration information
	function create_config() {
		var console_object=this
		console_object.config_data={}
		$("#caladmin_container").append("<div id='add_conf_dialog'></div>")
		$("#add_conf_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "On-Call Calendar - Configuration",
			width: "40%",
			height: 440,
			postion: {my: "center top", at: "center top+50", of: "#caladmin_container"},
			buttons: [{
				text: "Next",
				click: function() {
					if(console_object.config_data['embedded']!='Yes') {
						console_object.config_data['embedded']='No'
					}
					save_new_config(console_object.config_data)
					check_db_config()
				}
			}]
		})
		$("#add_conf_dialog").empty()
		$("#add_conf_dialog").append("<div id='no_conf'></div>")
		$("#no_conf").append("<p>No configuration file was found, proceeding with installation and configuration.</p>")
		$("#add_conf_dialog").append("<form id='add_conf_form' method='GET' action=''></form>")
		$("#add_conf_form").append("<table id='add_conf_table'></table>")
		$("#add_conf_table").append("<tr><th>Section:</th><th>Database Configuration<input type='hidden' name='section1' value='database_config'/></th></tr>")
		$("#add_conf_table").append("<tr><th title='Host where the MySQL database will live'>host</th><td><input type='text' name='host' size='40'/></td></tr>")
		$("#add_conf_table").append("<tr><th title='Username which will be used to access the on-call calendar database'>user</th><td><input type='text' name='user' size='40'/></td></tr>")
		$("#add_conf_table").append("<tr><th>password</th><td><input type='text' name='password' size='40'/></td></tr>")
		$("#add_conf_table").append("<tr><th title='The database to use for the on-call calendar'>database name</th><td><input type='text' name='db' size='40'/></td></tr>")
		$("#add_conf_table").append("<tr><th>Section:</th><th>Javascript Config</th></tr>")
		$("#add_conf_table").append("<tr><th title='Will this calendar be embedded in another site? (i.e. a Confluence wiki)'>embedded</th><td><input type='checkbox' name='embedded' value='Yes'/></td></tr>")
		$("#add_conf_table").append("<tr><th title='The hostname of the server where the calendar will be embedded'>embed host</th><td><input type='text' name='embed_host' size='40'/></td></tr>")
		$("#add_conf_table").append("<tr><th title='The name of the server where the calendar actually resides'>calendar host</th><td><input type='text' name='ajax_host' size='40'/></td></tr>")
		$("input").change(function() {
			if($(this).attr('type')=="checkbox") {
				if(this.checked) {
					$(this).attr('value',"Yes")
				} else {
					$(this).attr('value',"No")
				}
			}
			console_object.config_data[this.name]=this.value
		})
		$("#add_conf_dialog").dialog("open")
		$("#add_conf_table").tooltip()
	}

	// save_new_config
	// Passes the config file info to a PHP function to write out the file
	function save_new_config(configdata) {
		var console_object=this
		$.ajax({
			type: 'POST',
			url: "http://"+window.location.host+"/admin/php/save_conf.php",
			async: false,
			dataType: 'text',
			data: configdata,
			success: function(data) {
				if(data.length > 0) {
					alert(data)
				} else {
					alert("Configuration saved")
				}
			}
		})
	}

	// get_create_db
	// Dialog to prompt for MySQL admin credentials to create the database and
	// oncall user, or to show SQL script for manual creation.
	function get_create_db() {
		var console_object=this
		$("#add_conf_dialog").dialog('destroy')
		$("#caladmin_container").append('<div id="createdb_dialog"></div>')
		$("#createdb_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "On-Call Calendar - Database",
			width: "60%",
			height: 340,
			postion: {my: "center top", at: "center top+50", of: "#caladmin_container"},
			buttons: [{
				text: "Initialize the database",
				click: function() {
					init_database($("#createdb_form").serializeArray())
					check_db_config()
				}
			},
			{
				text: "I have created the database",
				click: function() {
					$("#createdb_dialog").dialog("close")
					check_db_config()
				}
			}]
		})
		$("#createdb_dialog").append('<p>The configuration file points to an inaccessible database (the error returned is: '+console_object.confResult['error_msg']+')</p>')
		$("#createdb_dialog").append('<p>Please ensure that you have configured access to the database for the oncall calendar user. If the user and/or database have not been created you may either do that manually <span class="ui-state-default ui-corner-all" title=".ui-icon-info" id="initdb_info_button"><span class="ui-icon ui-icon-info" style="display: inline; height: 20px; width: 16px;"><img src="/css/oncall-theme/images/ui-bg_highlight-hard_50_879ab5_1x100.png" height="16px" width="16px" style="opacity: 0;"></span></span> now or let me do it for you</p>')
		$("#createdb_dialog").append('<form id="createdb_form" method="GET" action=""></form>')
		$("#createdb_form").append('<table id="createdb_table"></table>')
		$("#createdb_table").append('<tr><th>MySQL admin user (usually root):</th><td><input type="text" size="40" id="db_admin_user" name="db_admin_user" value="root"/>')
		$("#createdb_table").append('<tr><th>MySQL admin user password:</th><td><input type="password" size="40" id="db_admin_passwd" name="db_admin_passwd"/>')
		$("#createdb_dialog").dialog("open")
		$("#initdb_info_button").click( function() {
			Show_initdb_info()
		})
	}

	// Show_initdb_info
	// Pops up a dialog with the SQL script to create the database, user and tables
	function Show_initdb_info() {
		var console_object = this
		$("#caladmin_container").append('<div id="initdb_info_dialog"></div>')
		$("#initdb_info_dialog").append('<p>CREATE DATABASE '+console_object.config_data.database_config.db+';</p>')
		$("#initdb_info_dialog").append('<p>USE '+console_object.config_data.database_config.db+';</p>')
		$("#initdb_info_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "On-Call Database Initialization Steps",
			width: "40%",
			height: 500,
			position: {my: "center top", at: "center top+20", of: "#caladmin_container"},
			buttons: [{
				text: "Close",
				click: function() {
					$("#initdb_info_dialog").dialog("close")
				}
			}]
		})
		$.getJSON('/admin/php/Init_database.php?table=all&do=info', function(data) {
			$.each(data, function(table, sqlinfo) {
				$("#initdb_info_dialog").append('<p>'+sqlinfo['drop']+';</p>')
				$("#initdb_info_dialog").append('<p id="create_'+table+'"></p>')
				$.each(sqlinfo['create'], function(sql_line,sql) {
					$("#create_"+table).append(sql+'<br>')
				})
			})
		})
		$("#initdb_info_dialog").append('<p>GRANT ALL ON '+config_data.database_config.db+'.* to \''+config_data.database_config.user+'\'@\''+config_data.javascript_config.ajax_host+'\' IDENTIFIED BY \''+config_data.database_config.password+'\';</p>')
		$("#initdb_info_dialog").dialog('open')
	}

	// init_database
	// Use the admin credentials given and the config file to create the database and user
	function init_database(admin_form) {
		var console_object = this
		var admin_info = {}
		var tables = new Array('caldays','calendar','edits','groupmap','groups','victims')
		$.each(admin_form, function(key, data) {
			admin_info[data['name']] = data['value']
		})
		$("#createdb_dialog").dialog("destroy")
		$("#caladmin_container").append('<div id="initdb_progress"></div>')
		$("#initdb_progress").dialog({
			autoOpen: false,
			modal: true,
			closeOnEscape: false,
			resizable: false,
			title: "Initializing On-Call Calendar Database",
			width: "40%",
			height: 300,
			position: {my: "center top", at: "center top+100", of: "#caladmin_container"},
			buttons: [{
				text: "OK",
				disabled: true
			}]
		})
		$("#initdb_progress").append('<span id="init_status_txt">Initializing database</span>')
		$("#initdb_progress").append('<div id="initdb_progressbar"></div>')
		$("#initdb_progressbar").progressbar({ max: 100 })
		$("#initdb_progress").dialog("open")
		$.ajax({
			url: '/admin/php/Init_database.php?do=initdb&user='+admin_info['db_admin_user']+'&passwd='+admin_info['db_admin_passwd'],
			async: false,
			success: function() {
				$("#initdb_progressbar").progressbar({value: 12})
			}
		})
		$.ajax({
			url: '/admin/php/Init_database.php?do=add_user&user='+admin_info['db_admin_user']+'&passwd='+admin_info['db_admin_passwd'],
			async: false,
			success: function() {
				$("#initdb_progressbar").progressbar({value: 25})
			}
		})
		$.each(tables, function(key,data) {
			$.ajax({
				url: '/admin/php/Init_database.php?do=execute&table='+data,
				async: false,
				success: function() {
					$("#initdb_progressbar").progressbar({value: $("#initdb_progressbar").progressbar('value')+12.5})
				}
			})
		})
		$("#initdb_progress").append('<p>Database initialization complete</p>')
		$("#initdb_progress").dialog('option','buttons',[{text: "OK", disabled: false, click: function() { $("#initdb_progress").dialog("close") } }])
	}

	function initialize_caldays()
	{
		var console_object=this
		var now=new Date()
		var year=now.getFullYear()
		var month=now.getMonth()+1
		$('#caladmin_container').append('<div id="init_caldays"></div>')
		$('#init_caldays').dialog(
		{
			autoOpen: false
			,modal: true
			,closeOnEscape: true
			,resizable: true
			,title: 'Initialize Calendar Data'
			,width: '40%'
			,height: 300
			,position: {my: 'center top', at: 'center top+100', of: '#caladmin_container'}
			,buttons: [{
				text: 'Initialize'
				,click: function() {
					var init_cal_data = $('#init_cal_form').serializeArray()
					do_initialize_caldays(init_cal_data)
					$('#admin_console').empty()
					display_admin_console()
				}
			}]
		})
		$('#init_caldays').append('<p>The calendar days table in your database is currently empty, please specify a time period for the initial calendar data</p>')
		$('#init_caldays').append('<form id="init_cal_form" method="GET" action=""></form>')
		$('#init_cal_form').append('<div id="init_cal_year"><span>Start Year: </span></div>')
		$('#init_cal_year').append('<select id="start_year" name="start_year"></select>')
		$('#start_year').append('<option value="'+year+'">'+year+'</option>')
		$('#start_year').append('<option value="'+(year-1)+'">'+(year-1)+'</option>')
		$('#init_cal_form').append('<div id="init_cal_month"><span>Start Month: </span></div>')
		$('#init_cal_month').append('<select id="start_month" name="start_month"></select>')
		$.each(cal_months, function(mo_num, mo_name) {
			$('#start_month').append('<option value="'+mo_num+'">'+mo_name+'</option>')
		})
		$('#init_cal_form').append('<div id="init_year_label"><span>Extend Calendar to the end of: </span></div>')
		$('#init_year_label').append('<select id="init_cal_end" name="init_cal_end"></select>')
		var i=year
		var extyear=i
		var j=i+5
		for(i; i<=j; i++) {
			$("#init_cal_end").append("<option value='"+i+"'>"+i+"</option>")
		}
		$('#init_caldays').dialog('open')
	}

	function do_initialize_caldays(init_data)
	{
		var console_object=this
		var init_cal_string = ''
		$.each(init_data, function(key,data) {
			var data_key = data['name']
			var data_val = data['value']
			init_cal_string += data_key+'='+data_val+'&'
		})
		$.ajax({
			url: '/admin/php/Do_initialize_caldays.php?'+init_cal_string.substring(0,init_cal_string.length-1)
			,async: false
			,type: 'GET'
			,dataType: 'text'
			,success: function(data) {
				if(typeof data!="undefined" && data!=null) {
					if(data.length > 0) {
						alert("Error initializing calendar: \n"+data)
					}
				} else {
					alert('Calendar data initialized successfully')
				}
				$('#init_caldays').dialog('close')
			}
		})
	}

	// display_admin_console
	// Tabbed console that shows configuration, group, oncall user and calendar info
	function display_admin_console() {
		var console_object=this
		$("#admin_console").append("<div id='ac_head'></div>")
		$("#ac_head").append("<h2>On-Call Calendar Administration</h2>")
		$("#admin_console").append("<div id='ac_box'></div>")
		$("#ac_box").append("<ul></ul>")
		$("#ac_box ul").append("<li><a href='#config_info'></span>Configuration</span></li>")
		$("#ac_box ul").append("<li><a href='#groups_info'><span>Groups</span></a></li>")
		$("#ac_box ul").append("<li><a href='#users_info'></span>Users</span></a></li>")
		$("#ac_box ul").append("<li><a href='#calendar_setup'><span>Calendar Setup</span></a></li>")
		// Configuration file tab
		$("#ac_box").append("<div id='config_info'></div>")
		build_config_tab()
		// Groups tab
		$("#ac_box").append("<div id='groups_info'></div>")
		$("#groups_info").append("<table id='grouplist'></table>")
		var group_promise = get_group_info()
		group_promise.done(function(groupData) {
			$("#grouplist").empty()
			$("#grouplist").append("<tr>\n<th>ID</th><th>Name</th><th>Active</th><th>Autorotate</th><th>Turnover</th><th>Backup</th><th>Panic</th><th>Oncall Email</th><th>Backup Email</th><th>Panic Email</th><th>Group Email</th><th></th>\n</tr>")
			$("#groups_info").append('<button id="add_group_button" role="button" onClick="'+name+'.add_new_group()">Add New Group</button>')
			$("#groups_info").append('<button id="edit_groups_button" role="button" onClick="'+name+'.edit_groups()">Edit Groups</button>')
			$("#add_group_button").button()
			$("#edit_groups_button").button()
			if(groupData[1]=="empty") {
				$("#edit_groups_button").button('option','disabled',true)
			} else {
				$.each(groupData, function(k,v) {
					if((k%2)==0) {
						$("#grouplist").append("<tr id='gRow_"+k+"'></tr>")
					} else {
						$("#grouplist").append("<tr id='gRow_"+k+"' style='background: white;'></tr>")
					}
					$("#gRow_"+k).append("<td>"+v['id']+"</td>")
					$("#gRow_"+k).append("<td>"+v['name']+"</td>")
					$("#gRow_"+k).append("<td>"+basic_boolean[v['active']]+"</td>")
					$("#gRow_"+k).append("<td>"+basic_boolean[v['autorotate']]+"</td>")
					$("#gRow_"+k).append("<td>"+sanitize(v['turnover_hour'])+":"+sanitize(v['turnover_min'])+"</td>")
					$("#gRow_"+k).append("<td>"+basic_boolean[v['backup']]+"</td>")
					$("#gRow_"+k).append("<td>"+basic_boolean[v['failsafe']]+"</td>")
					$("#gRow_"+k).append("<td>"+v['alias']+"</td>")
					$("#gRow_"+k).append("<td>"+v['backup_alias']+"</td>")
					$("#gRow_"+k).append("<td>"+v['failsafe_alias']+"</td>")
					$("#gRow_"+k).append("<td>"+v['email']+"</td>")
					$("#gRow_"+k).append("<td><span id='delete_"+k+"' onClick='"+console_object.name+".delete_group("+v['id']+")'>Delete</span></td>")
					$("#delete_"+k).mouseover(function() {
						$("#delete_"+k).css({"cursor":"pointer"})
					})
				})
			}
		})
		// Users Tab
		$("#ac_box").append("<div id='users_info'></div>")
		$("#users_info").append("<table id='userlist'></table>")
		var user_info_promise = get_user_info()
		user_info_promise.done(function(userData) {
			$("#userlist").empty()
			$("#userlist").append("<tr>\n<th>ID</th><th>Username</th><th>Name</th><th>Cell Phone</th><th>Active</th><th>SMS Email</th><th></th>\n</tr>")
			$("#users_info").append('<button id="add_user_button" role="button" onClick="'+name+'.addNewVictim()">Add New User</button>')
			$("#users_info").append('<button id="edit_users_button" role="button" onClick="'+name+'.editVictims()">Edit Users</button>')
			$("#add_user_button").button()
			$("#edit_users_button").button()
			if(userData[1]=="empty") {
				$("#edit_users_button").button('option','disabled',true)
			} else {
				$.each(userData, function(k,v) {
					if((k%2)==0) {
						$("#userlist").append("<tr id='uRow_"+k+"'></tr>")
					} else {
						$("#userlist").append("<tr id='uRow_"+k+"' style='background: white;'></tr>")
					}
					$("#uRow_"+k).append("<td>"+v['id']+"</td>")
					$("#uRow_"+k).append("<td>"+v['username']+"</td>")
					$("#uRow_"+k).append("<td>"+v['firstname']+" "+v['lastname']+"</td>")
					$("#uRow_"+k).append("<td>"+v['phone']+"</td>")
					$("#uRow_"+k).append("<td>"+basic_boolean[v['active']]+"</td>")
					$("#uRow_"+k).append("<td>"+v['sms_email']+"</td>")
					$("#uRow_"+k).append("<td><span id='userdel_"+k+"' onClick='"+console_object.name+".delete_user("+v['id']+")'>Delete</span></td>")
					$("#userdel_"+k).mouseover(function() {
						$("#userdel_"+k).css({"cursor":"pointer"})
					})
				})
				console_object.userData=userData
			}
		})
		// Calendar Setup Tab
		$("#ac_box").append("<div id='calendar_setup'></div>")
		var cal_info_promise = get_calendar_info()
		cal_info_promise.done(function(calendarData) {
			$("#calendar_setup").empty()
			$("#calendar_setup").append("<table id='calinfo'></table>")
			$("#calinfo").append("<tr id='cend'><tr>")
			$("#cend").append("<th>Calendar currently extends through:</th>")
			if(calendarData[1]=="empty") {
				$("#cend").append("<td>No Data</td>")
				initialize_caldays()
			} else {
				$("#cend").append("<td>"+calendarData['month']+"/"+calendarData['day']+"/"+calendarData['year']+"</td>")
				$("#calendar_setup").append("<form id='extend_cal_form' method='GET' action=''></form>")
				$("#extend_cal_form").append("<div id='ecf_label'><span>Extend Calendar to: </span></div>")
				$("#ecf_label").append("<select id='end_year' name='end_year'></select>")
				var i=parseInt(calendarData['year'])+1
				var extyear=i
				var j=i+5
				for(i; i<=j; i++) {
					$("#end_year").append("<option value='"+i+"'>"+i+"</option>")
				}
				$("select").change( function() {
					extyear=this.attr('value')
				})
				$("#calendar_setup").append('<button id="extend_cal_button" role="button" onClick="'+console_object.name+'.extend_calendar('+extyear+')">Extend Calendar</button>')
				$("#extend_cal_button").button()
			}
		})
		$("#ac_box").tabs({
			heightStyle: "content"
		})
	}

	function build_config_tab() {
		var console_object=this
		$("#config_info").empty()
		$("#config_info").append("<table id='configitemstable'></table>")
		var config_promise = get_config_info()
		config_promise.done(function(config_data) {
			console_object.config_data=config_data
			$.each(config_data, function(k,v) {
				$("#configitemstable").append("<tr><th>Section:</th><th>"+k+"</th></tr>")
				$.each(v, function(vk,vv) {
					$("#configitemstable").append("<tr><th>"+vk+"</th><td>"+vv+"</td></tr>")
				})
			})
		})
		$("#config_info").append('<button id="edit_config" role="button" onClick="'+name+'.edit_config()">Edit</button>')
		$("#edit_config").button()
	}

	// get_config_info
	// Function that makes an AJAX call to retrieve configuration
	function get_config_info() {
		var console_object=this
		var config_info = $.Deferred()
		$.getJSON("http://"+window.location.host+"/admin/php/get_config_info.php", function(data) {
			config_info.resolve(data)
		})
		return config_info.promise()
	}

  // edit_config
	// Pop up a dialog box for editing the configuration file
	function edit_config() {
		var console_object=this
		var confEdits
		confEdits=0
		$("#caladmin_container").append("<div id='edit_conf_dialog'></div>")
		$("#edit_conf_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "Editing Configuration",
			width: "40%",
			height: 440,
			postion: {my: "center top", at: "center top+50", of: "#caladmin_container"},
			buttons: [{
				text: "Save Changes",
				click: function() {
					console_object.save_config_edits(config_data,confEdits)
				}
			},
			{
				text: "Done",
				click: function() {
					$("#edit_conf_dialog").dialog("close")
				}
			}]
		})
		$("#edit_conf_dialog").empty()
		$("#edit_conf_dialog").append("<form id='edit_conf_form' method='GET' action=''></form>")
		$("#edit_conf_form").append("<table id='edit_conf_table'></table>")
		var sections=0
		$.each(config_data, function(k,v) {
			sections+=1
			$("#edit_conf_table").append("<tr><th>Section:</th><th>"+k+"<input type='hidden' name='section"+sections+"' value='"+k+"'/></th></tr>")
			$.each(v, function(vk,vv) {
				if(vv=="No" || vv=="Yes") {
					$("#edit_conf_table").append("<tr><th>"+vk+"</th><td><input type='checkbox' section='"+k+"' name='"+vk+"' value='yes'/>")
					if(vv=="yes") {
						$('input:checkbox[name='+vk+']').attr('checked',true)
					}
				} else {
					$("#edit_conf_table").append("<tr><th>"+vk+"</th><td><input type='text' section='"+k+"' name='"+vk+"' value='"+vv+"' size='40'/></td></tr>")
				}
			})
			// Potentially could allow additional items to be added, disabling that for now
			//$("#edit_conf_table").append("<tr><td><input type='text' name='new_"+k+"' size='20'/></td><td><input type='text' name='new_"+k+"_value' size='40'/></td></tr>")
			$("#edit_conf_table").append("<tr><td colspan='2'><hr></td></tr>")
		})
		$("input").change(function() {
			if($(this).attr('type')=="checkbox") {
				if(this.checked) {
					$(this).attr('value',"yes")
				} else {
					$(this).attr('value',"no")
				}
			}
			config_data[$(this).attr('section')][this.name]=this.value
			confEdits+=1
		})
		$("#edit_conf_dialog").dialog("open")
	}

	// save_config_edits
	// Makes an AJAX call to save the updated configuration file
	function save_config_edits(changes,num) {
		var console_object=this
		if(num < 1) {
			alert("No changes to make")
			return
		} else {
			$.ajax({
				type: 'POST',
				url: "http://"+window.location.host+"/admin/php/save_conf_changes.php",
				async: false,
				dataType: 'text',
				data: changes,
				success: function(data) {
					if(data.length > 0) {
						alert(data)
					}
					alert("Changes saved")
				}
			})
		}
		console_object.build_config_tab()
	}

	// get_group_info
	// Makes an AJAX call to retrieve oncall groups from the database
	function get_group_info() {
		var console_object=this
		var group_info = $.Deferred()
		$.getJSON("http://"+window.location.host+"/admin/php/get_groups.php", function(data) {
			group_info.resolve(data)
		})
		return group_info.promise()
	}

	// add_new_group
	// Pops up dialog box to add new group to the database
	function add_new_group() {
		var console_object=this
		var newGroupData={}
		$("#caladmin_container").append("<div id='add_group_dialog'></div>")
		$("#add_group_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "Add New Group",
			width: "40%",
			height: 500,
			postion: {my: "center top", at: "center top+20", of: "#admin_console"},
			buttons: [{
				text: "Save",
				click: function() {
					var missing=[]
					var reqs={"group_name":"Name","group_email":"Group Email List","group_turn_hour":"Turnover Hour","group_turn_min":"Turnover Minutes"}
					for(var r in reqs) {
						if($("#add_group input[name='"+r+"']").attr("value").length<1) {
							missing.push(reqs[r])
							$("#add_group input[name='"+r+"']").css("background-color","#faa")
						}
					}
					if(missing.length > 0) {
						alert("Please fill in the following field(s) for the group you are trying to create:\n"+missing.join(", "))
						return
					} else {
						newGroupData=$("#add_group").serializeArray()
						console_object.save_add_group(newGroupData)
					}
				}
			},
			{
				text: "Done",
				click: function() {
					console_object.get_group_info()
					$("#add_group_dialog").dialog("close")
				}
			}]
		})
		$("#add_group_dialog").empty()
		$("#add_group_dialog").append("<form id='add_group' method='GET' action='javascript:"+this.name+".save_add_group()'></form>")
		$("#add_group").append("<div id='gname'><span>Name:</span><input type='text' name='group_name' size='30'/><div>")
		$("#add_group").append("<div id='gemail'><span>Group Email List:</span><input type='text' name='group_email' size='30'/><div>")
		$("#add_group").append("<div><input type='checkbox' name='group_active' value='yes'/><label for='group_active'>Active</label><div>")
		$("#add_group").append("<div><input type='checkbox' name='group_autorotate' value='yes'/><label for='group_autorotate'>Autorotate</label><div>")
		$("#add_group").append("<div id='gturn'><span>Turnover Time:</span><input type='text' name='group_turn_hour' size='2' value='09'/>:<input type='text' name='group_turn_min' size='2' value='30'/><div>")
		$("#add_group").append("<div id='goncall'><span>Oncall Email:</span><input type='text' name='group_oncall_email' size='15'/><div>")
		$("#add_group").append("<div><input type='checkbox' name='group_backup' value='yes'/><label for='group_backup'>Backup</label><div>")
		$("#add_group").append("<div id='gbackup'><span>Backup Email:</span><input type='text' name='group_backup_email' size='15'/><div>")
		$("#add_group").append("<div><input type='checkbox' name='group_panic' value='yes'/><label for='group_panic'>Panic</label><div>")
		$("#add_group").append("<div id='gpanic'><span>Panic Email:</span><input type='text' name='group_panic_email' size='15'/><div>")
		$('input[name="group_backup_email"]').attr("disabled","disabled")
		$('input[name="group_panic_email"]').attr("disabled","disabled")
		$("input").change(function() {
			if($(this).attr("type")=="checkbox") {
				if(this.checked) {
					$(this).attr('value','1')
					if($(this).attr("name")=="group_backup") {
						$('input[name="group_backup_email"]').attr("disabled",null)
					} else if($(this).attr("name")=="group_panic") {
						$('input[name="group_panic_email"]').attr("disabled",null)
					}
				} else {
					$(this).attr('value','0')
					if($(this).attr("name")=="group_backup") {
						$('input[name="group_backup_email"]').attr("disabled","disabled")
					} else if($(this).attr("name")=="group_panic") {
						$('input[name="group_panic_email"]').attr("disabled","disabled")
					}
				}
			}
		})
		$("#add_group_dialog").dialog("open")
		var bumper=$('#gemail span').outerWidth()
		$('input[name="group_name"]').css("margin-left", function(index,value) {
			var marg=((bumper-$('#gname span').outerWidth())+2)
			return(marg+"px")
		})
		$('input[type="checkbox"]').css("margin-left", function(index,value) {
			var marg=(bumper+7)
			return(marg+"px")
		})
		$('input[name="group_turn_hour"]').css("margin-left", function(index,value) {
			var marg=((bumper-$("#gturn span").outerWidth())+2)
			return(marg+"px")
		})
		$('input[name="group_oncall_email"]').css("margin-left", function(index,value) {
			var marg=((bumper-$("#goncall span").outerWidth())+2)
			return(marg+"px")
		})
		$('input[name="group_backup_email"]').css("margin-left", function(index,value) {
			var marg=((bumper-$("#gbackup span").outerWidth())+2)
			return(marg+"px")
		})
		$('input[name="group_panic_email"]').css("margin-left", function(index,value) {
			var marg=((bumper-$("#gpanic span").outerWidth())+2)
			return(marg+"px")
		})
	}

	// edit_groups
	// Pops up dialog box to edit the existing group information
	function edit_groups() {
		console_object=this
		$("#edit_groups_dialog").dialog({
			autoOpen: false,
			closeOnEscape: true,
			modal: true,
			resizable: true,
			title: "Editing Groups",
			width: "75%",
			height: 400,
			position: {my: "center top", at: "center top+20", of: "#admin_console"},
			buttons: [{
				text: "Save Changes",
				click: function() {
					console_object.updateGroups(groupsChangeList)
				}
			},
			{
				text: "Cancel",
				click: function() {
					$(this).dialog("close")
				}
			}]
		})
		$("#edit_groups_dialog").empty()
		$("#edit_groups_dialog").append('<form id="edit_groups_form" method="GET" action=""></form>')
		$("#edit_groups_form").append('<div id="egroups"></div>')
		$("#egroups").append('<div id="egroups_header"></div>')
		$("#egroups_header").append('<span id="eg_name">Name</span><span id="eg_active">Active</span><span id="eg_autorotate">Autorotote</span><span id="eg_turnover">Turnover</span><span id="eg_backup">Backup</span><span id="eg_panic">Failover</span><span id="eg_oncallemail">Oncall Email</span><span id="eg_buemail">Backup Email</span><span id="eg_panicemail">Failover Email</span><span id="eg_groupemail">Group Email</span>')
	}

	// save_add_group
	// Makes an AJAX call to save new group info to the database
	function save_add_group(newGroup) {
		console_object=this
		$.ajax({
			url: "http://"+window.location.host+"/admin/php/add_new_group.php",
			type: 'POST',
			data: newGroup,
			dataType: 'text',
			async: false,
			success: function(data) {
				if(data.length > 0) {
					alert("Error adding group: \n"+data)
				} else {
					alert("New Group added")
					$("#add_group")[0].reset()
				}
			}
		})
	}

	// delete_group
	// Makes an AJAX call to delete a group record from the database
	function delete_group(gid) {
		console_object=this
		if(confirm("Are you sure you want to delete group "+console_object.groupData[gid].name+"?")) {
			$.post("http://"+window.location.host+"/admin/php/del_group.php?gid="+gid, function(data) {
				if(data.length > 0) {
					alert("Error deleting group:\n"+data)
				} else {
					alert("Group removed")
				}
			})
		}
		console_object.get_group_info()
	}

	// get_user_info
	// Makes an AJAX call to pull all user information from the database
	function get_user_info() {
		var console_object=this
		var user_info = $.Deferred()
		$.getJSON("http://"+window.location.host+"/admin/php/get_allvictims.php", function(data) {
			user_info.resolve(data)
		})
		return user_info.promise()
	}

	// delete_user
	// Makes an AJAX call to remove a user from the database
	function delete_user(uid) {
		console_object=this
		if(confirm("Are you sure you want to delete user "+console_object.userData[uid].username+"?")) {
			$.post("http://"+window.location.host+"/admin/php/del_user.php?gid="+gid, function(data) {
				if(data.length > 0) {
					alert("Error deleting user:\n"+data)
				} else {
					alert("Group removed")
				}
			})
		}
		console_object.get_user_info()
	}

	// get_calendar_info
	// Makes an AJAX call to get the last date configured for the calendar
	function get_calendar_info() {
		var console_object=this
		var calendar_info = $.Deferred() 
		$.getJSON("http://"+window.location.host+"/admin/php/get_calinfo.php", function(data) {
			calendar_info.resolve(data)
		})
		return calendar_info.promise()
	}
	
	// extend_calendar
	// Makes an AJAX call to populated dates in the database out to Dec. 31 of the chosen year
	function extend_calendar(year) {
		console_object=this
		if(confirm("Are you sure you want to extend the calendar days to "+year+"?")) {
			$("#calendar_setup").empty()
			$.ajax({
				url: "http://"+window.location.host+"/admin/php/extend_caldays.php?end="+year,
				async: false,
				success: function(data) {
					if(typeof data!="undefined" && data!=null) {
						if(data.length > 0) {
							alert("Error extending calendar: \n"+data)
						}
					} else {
						alert("Calendar extended")
					}
				}
			})
		}
		console_object.get_calendar_info()
	}

}

// get_db_config_status
// Makes an AJAX call to check the status of the configuration file and the database
function get_db_config_status() {
	var checkConfigFileURL= "http://"+window.location.host+"/admin/php/validate_config.php"
	var confInfo = {}
	$.ajax({
		url: checkConfigFileURL,
		async: false,
		data: {},
		dataType: 'json',
		success: function(data) {
			confInfo=data
		},
		error: function(data) {
			confInfo=data
		}
	})
	return(confInfo)
}

// sanitize
// Simple function to prepend any single digits pulled from the database with a leading 0
function sanitize(digit) {
	if(digit<=9) {
		var digit = "0"+digit
	}
	return(digit)
}

