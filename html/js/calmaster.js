groupColors=new Array("","blue", "purple", "red", "green", "darkgoldenrod", "teal", "darkorchid", "orangered", "olivedrab", "orange")
monthStrings=new Array("January","February","March","April","May","June","July","August","September","October","November","December")
weekDays=new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday")

function leanOncallCal(name) {

  this.name=name

  this.buildCal=buildCal
  this.buildLegend=buildLegend
  this.display=display
  this.goToPrev=goToPrev
  this.goToNext=goToNext
//  this.buildDayForm=buildDayForm
  this.editDay=editDay
  this.updateDay=updateDay
  this.editMonth=editMonth
  this.updateMonth=updateMonth
  this.cancelMonthEdit=cancelMonthEdit
  this.editGroupDialog=editGroupDialog
  this.editGroupMembersDialog=editGroupMembersDialog
  this.updateGroupMembers=updateGroupMembers
  this.updateGroupInfo=updateGroupInfo

  function buildCal(month,year) {
    this.now=new Date()
    if(typeof month=="undefined") {
      this.curMonth=this.now.getMonth()
    } else {
      this.curMonth=month
    }
    if(typeof year=="undefined") {
      this.curYear=this.now.getFullYear()
    } else {
      this.curYear=year
    }
    this.prevCalMonth = new Date(this.curYear,this.curMonth - 1,15).moveToLastDayOfMonth()
    this.prevMonth = this.prevCalMonth.getMonth()
    this.prevMonthYear = this.prevCalMonth.getFullYear()
    this.nextCalMonth = new Date(this.curYear,this.curMonth + 1,15).moveToFirstDayOfMonth()
    this.nextMonth = this.nextCalMonth.getMonth()
    this.nextMonthYear = this.nextCalMonth.getFullYear()
    this.realMonth=this.curMonth+1


    this.victims=getVictims(this.curYear,this.realMonth)

    this.dayCount=Date.getDaysInMonth(this.curYear,this.curMonth)
    this.firstDay=new Date(this.curYear,this.curMonth,15).moveToFirstDayOfMonth()
    this.firstDayNum=this.firstDay.getDay()
    this.lastDay=new Date(this.curYear,this.curMonth,15).moveToLastDayOfMonth()
    this.lastDayNum=this.lastDay.getDay()

    if(this.victims==null) {
      this.victims=new Array()
      i = 0
      l = 0
    } else if(Object.keys(this.victims).length < this.dayCount) {
      var i = Object.keys(this.victims).length
      if(i > 0) {
	var k = (Object.keys(this.victims))
	var l = k[i-1] + 1
      } else {
	l = i+1
      }
    }
    while(i < this.dayCount) {
      var v = new Array()
      var d = i+1
      if(d < 10) {
	d = '0'+d
      }
      v[0] = new Array(d,'','','')
      this.victims[l] = v
      l++
      i++
    }

    if(this.firstDayNum > 0) {
      var td = this.firstDay.addDays(-this.firstDayNum).getDate()
      var tm = this.firstDay.getMonth()+1
      var ty = this.firstDay.getFullYear()
      this.preVictims=getVictims(ty,tm,td,"pre");
      if(this.preVictims==null) {
	this.preVictims=new Array()
	var i = 0
	while(i < this.firstDayNum ) {
	  var v = new Array()
	  v[0] = new Array(td+i,'','','')
	  this.preVictims[i] = v
	  i++
	}
      }
    }

    if(this.lastDayNum < 6) {
      var postPad = 6 - this.lastDayNum
      var td = this.lastDay.addDays(postPad).getDate()
      var tm = this.lastDay.getMonth()+1
      var ty = this.lastDay.getFullYear()
      this.postVictims=getVictims(ty,tm,td,"post")
      if(this.postVictims==null) {
	this.postVictims=new Array()
	var i = 0
	while(i < postPad ) {
	  var v = new Array()
	  var d = i+1
	  if(d < 10) {
	    d = '0'+d
	  }
	  v[0] = new Array(i+1,'','','')
	  this.postVictims[i] = v
	  i++
	}
      }
    }
  }

  function buildLegend() {
    var cal=this
    cal.groupList=getGroupList()
    cal.groupMap=getGroupMap()
    ocjq.each(cal.groupList, function(i,data) {
      ocjq("#legend").append('<h4 style="color: '+groupColors[data.id]+'">'+data.name+'</h4>')
      ocjq("#legend").append('<div id="group'+data.id+'" class="groupinfo"></div>')
      ocjq("#group"+data.id).append('<button id="editmonth'+data.id+'" class="editmonthbutton" role="button" onClick="'+cal.name+'.editMonth('+cal.curYear+','+cal.curMonth+','+data.id+')">Edit Month</button>')
      ocjq("#group"+data.id).append('<input type="checkbox" class="ghide" id="group'+data.id+'_vis" value="gmem'+data.id+'"><label for="group'+data.id+'_vis">Hide Group</label>')
      ocjq('.ghide').change( function() {
	var toggle=this.value
	if(this.checked) {
	  ocjq("."+toggle).fadeOut()
          ocjq(".ohide").attr("disabled","disabled")
	} else {
	  ocjq("."+toggle).fadeIn()
          ocjq(".ohide").attr("disabled",null)
	}
      })
      ocjq("#group"+data.id).append('<br><input type="checkbox" class="ohide" id="group'+data.id+'_ovis" value="gmem'+data.id+'"><label for="group'+data.id+'_ovis">Hide Others</label>')
      ocjq('.ohide').change( function() {
        var otoggle=this.value
        if(this.checked) {
          ocjq(".victim").not("."+otoggle).fadeOut()
          ocjq("#group"+data.id+"_vis").attr("disabled","disabled")
          ocjq(".ohide").not(this).attr("disabled","disabled")
        } else {
          ocjq(".victim").not("."+otoggle).fadeIn()
          ocjq("#group"+data.id+"_vis").attr("disabled",null)
          ocjq(".ohide").not(this).attr("disabled",null)
        }
      })
      ocjq("#group"+data.id).append('<div class="clear"></div>')
      ocjq("#group"+data.id).append('<dl id="groupdata'+data.id+'"></dl>')
      ocjq("#groupdata"+data.id).append('<dt>Default Turnover Time:</dt>')
      ocjq("#groupdata"+data.id).append('<dd>'+sanitize(data.turnover_hour)+':'+sanitize(data.turnover_min)+'</dd>')
      ocjq("#groupdata"+data.id).append('<dt>Group contact email address:</dt>')
      ocjq("#groupdata"+data.id).append('<dd><a href="mailto:'+data.email+'">'+data.email+'</a></dd>')
      ocjq("#groupdata"+data.id).append('<dt>Zenoss Auto Rotation:</dt>')
      if(data.autorotate > 0) {
	ocjq("#groupdata"+data.id).append('<dd>Active</dd>')
	ocjq("#groupdata"+data.id).append('<dt>On-call pager address:</dt>')
	ocjq("#groupdata"+data.id).append('<dd><a href="mailto:'+data.alias+'@oncall.leanlogistics.com">'+data.alias+'@oncall.leanlogistics.com</a></dd>')
	ocjq("#groupdata"+data.id).append('<dt>Backup pager address:</dt>')
	ocjq("#groupdata"+data.id).append('<dd><a href="mailto:'+data.backup_alias+'@oncall.leanlogistics.com">'+data.backup_alias+'@oncall.leanlogistics.com</a></dd>')
	ocjq("#groupdata"+data.id).append('<dt>Panic pager address:</dt>')
	ocjq("#groupdata"+data.id).append('<dd><a href="mailto:'+data.failsafe_alias+'@oncall.leanlogistics.com">'+data.failsafe_alias+'@oncall.leanlogistics.cim</a></dd>')
      } else {
	ocjq("#groupdata"+data.id).append('<dd>Inactive</dd>')
      }
      ocjq("#groupdata"+data.id).append('<dt>Group Rotation Members</dt>')
      ocjq.each(cal.groupMap[data.id], function(k,v) {
	ocjq("#groupdata"+data.id).append('<dd>'+v+'</dd>')
      })
      ocjq("#groupdata"+data.id).append('<button id="editgroup'+data.id+'" class="editgroupbutton" role="button" onClick="'+cal.name+'.editGroupDialog('+data.id+')">Edit Group</button>')
      ocjq("#groupdata"+data.id).append('<button id="editgmem'+data.id+'" class="editgroupbutton" role="button" onClick="'+cal.name+'.editGroupMembersDialog('+data.id+')">Edit Members</button>')
      ocjq("#editmonth"+data.id).button()
      ocjq("#editgroup"+data.id).button()
      ocjq("#editgmem"+data.id).button()
      ocjq("#group"+data.id).css("padding",0)
    })
    ocjq("#legend").accordion({
      collapsible: "true",
      active: "false",
      heightStyle: "content"
    });
  }

  function display() {
    var cal=this
    hideDiv("calendar_grid")
    ocjq("#calendar_grid").html('')
    hideDiv("month_name")
    setTimeout(function() {
//      displayCalendar(cal.now,cal.curMonth,cal.curYear,cal.dayCount,cal.firstDayNum,cal.lastDayNum,cal.preVictims,cal.victims,cal.postVictims)
      displayCalendar(cal)
    }, 500)
    showDiv("month_name")
    showDiv("calendar_grid")
  }

  function goToPrev() {
    var cal=this
    cal.buildCal(cal.prevMonth,cal.prevMonthYear)
    cal.display()
    ocjq.each(cal.groupList, function(k,v) {
      ocjq("#editmonth"+v.id).attr("onClick",cal.name+'.editMonth('+cal.curYear+','+cal.curMonth+','+v.id+')')
    })
  }

  function goToNext() {
    var cal=this
    cal.buildCal(cal.nextMonth,cal.nextMonthYear)
    cal.display()
    ocjq.each(cal.groupList, function(k,v) {
      ocjq("#editmonth"+v.id).attr("onClick",cal.name+'.editMonth('+cal.curYear+','+cal.curMonth+','+v.id+')')
    })
  }

  function editDay(year,month,day,group) {
    var cal=this
    var editMonth = month+1
    var dailyVictims=getVictims(year,editMonth,day,"day",group)
    var editGroup=getGroupInfo(group)
    var gMembers=getGroupMembers(group)
    var slotColors=new Array('','LightBlue','LightGreen','LightSalmon','DarkKhaki','CadetBlue','SandyBrwn','DarkSeaGreen');
    var sColor=0
    ocjq("#edit_day").dialog({
      autoOpen: false,
      closeOnEscape: true,
      modal: true,
      resizable: true,
      title: 'Editing '+monthStrings[month]+' '+day+' for group '+editGroup.name,
      width: 600,
      height: 600,
      position: {my: "center top", at: "center top+25", of: "#calendar_box"},
      buttons: [{
	text: "Save",
	click: function() {
	  cal.updateDay()
	}
     },
     {
	text: "Cancel",
	click: function() {
	  ocjq(this).dialog("close")
	}
     }]
    })
    ocjq("#edit_day").html('')
    ocjq("#edit_day").append('<form id="edit_day_form" method="GET" action=""></form>')
    ocjq("#edit_day_form").append('<table id="edit_day_table" cellspacing="0" cellpadding="5" style="border: 1px solid #999;"></table>')
    ocjq("#edit_day_table").append('<tr id="item_head"><th><span>Start Time</span></th><th><span>Person</span></th></tr>')
    var s = 0
    var csv
    var psv
    cal.dayChanges = {}
    cal.dayChanges['g']=group
    cal.dayChanges['d']=day
    cal.dayChanges['m']=editMonth
    cal.dayChanges['y']=year
    while(s <= 23) {
      if(s < 10) {
	var slot='0'+s+':00'
	var slot2='0'+s+':30'
      } else {
	var slot=s+':00'
	var slot2=s+':30'
      }
      ocjq.each([slot,slot2], function(sk,stime) {
	if(typeof dailyVictims[stime]!="undefined") {
	  csv=dailyVictims[stime]
	  if(csv!=psv) {
	    sColor++
	  }
	  var slotString='<tr bgcolor="'+slotColors[sColor]+'"><td>'+stime+'</td>'
	  slotString=slotString+'<td><select id="'+stime+'">'
	  ocjq.each(gMembers, function(k,v) {
	    if(v[4]==1) {
	      if(csv==v[0]) {
		slotString=slotString+'<option value="'+k+'" selected="selected">'+v[0]+'</option>'
	      } else {
		slotString=slotString+'<option value="'+k+'">'+v[0]+'</option>'
	      }
	    }
	  })
	  slotString=slotString+'</select></td></tr>'
	  ocjq("#edit_day_table").append(slotString)
	  psv=csv
	} else {
	  var slotString='<tr bgcolor="Red"><td>'+stime+'</td>'
	  slotString=slotString+'<td><select id="'+stime+'"><option value="--">----</option>'
	  ocjq.each(gMembers, function(k,v) {
	    if(v[4]==1) {
	      slotString=slotString+'<td><option value="'+k+'">'+v[0]+'</option>'
	    }
	  })
	  slotString=slotString+'</select></td></tr>'
	  ocjq("#edit_day_table").append(slotString)
	}
      })
      s++
    }
    ocjq("select").change(function() {
      var cs = ocjq(this).attr('id')
      var vId = ocjq(this).attr('value')
      cal.dayChanges[cs]=vId
    })
    ocjq("#edit_day").dialog("open")
  }

  function updateDay() {
    var cal=this
    var updateDayURL="http://"+calHost+"/php/commit_day_changes.php"
    ocjq.ajax({
      traditional: true,
      type: 'POST',
      url: updateDayURL,
      async: false,
      dataType: 'text',
      data: cal.dayChanges,
      success: function(data) {
	ocjq("#edit_day").dialog("close")
	cal.buildCal(cal.dayChanges['m']-1,cal.dayChanges['y'])
	cal.display()
	ocjq("#edit_day").empty()
      }
    })

  }

  function editMonth(year,month,group) {
    ocjq("#legend").fadeOut();
    var cal=this
    cal.monthChanges = {}
    cal.monthChanges['g']=group
    cal.editDailyVictims=getVictims(year,month+1,'',"month",group)
    if(cal.editDailyVictims==null) {
      var i = 0
      var l = 0
      cal.editDailyVictims=new Array()
    } else if(Object.keys(cal.editDailyVictims).length < cal.dayCount) {
      var i = Object.keys(cal.editDailyVictims).length
      if(i > 0) {
	var k = (Object.keys(cal.editDailyVictims))
	var l = parseInt(k[i-1])+1
      }
    }
    while(i < cal.dayCount) {
      var v=new Array()
      var d=i+1
      if(d < 10) {
	d='0'+d
      }
      v[0]=new Array(d,'','','')
      cal.editDailyVictims[l]=v
      l++
      i++
    }
    cal.editGroupInfo=getGroupInfo(group)
    cal.editGroupMembers=getGroupMembers(group)
    var monthToEdit=month
    if(cal.firstDayNum > 0) {
      cal.firstDay=new Date(year,monthToEdit,15).moveToFirstDayOfMonth()
      var td = cal.firstDay.addDays(-cal.firstDayNum).getDate()
      var tm = cal.firstDay.getMonth()+1
      var ty = cal.firstDay.getFullYear()
      cal.preDailyVictims=getVictims(ty,tm,td,"pre",group);
      if(cal.preDailyVictims==null) {
	cal.preDailyVictims=new Array()
	var i = 0
	while(i < cal.firstDayNum ) {
	  var v = new Array()
	  v[0] = new Array(td+i,'','','')
	  cal.preDailyVictims[i] = v
	  i++
	}
      }
    }
    if(cal.lastDayNum < 6) {
      var postPad = 6 - cal.lastDayNum
      var monthToEdit = month
      cal.lastDay=new Date(year,monthToEdit,15).moveToLastDayOfMonth()
      var td = cal.lastDay.addDays(postPad).getDate()
      var tm = cal.lastDay.getMonth()+1
      var ty = cal.lastDay.getFullYear()
      cal.postDailyVictims=getVictims(ty,tm,td,"post",group)
      if(cal.postDailyVictims==null) {
	cal.postDailyVictims=new Array()
	var i = 0
	while(i < postPad ) {
	  var v = new Array()
	  var d = i+1
	  if(d < 10) {
	    d='0'+d
	  }
	  v[0] = new Array(d,'','','')
	  cal.postDailyVictims[i] = v
	  i++
	}
      }
    }
    hideDiv("calendar_grid")
    ocjq("#calendar_grid").html('')
    hideDiv("month_name")
    setTimeout(function() {
      displayMonthEditCalendar(cal)
    }, 500)
    showDiv("month_name")
    showDiv("calendar_grid")
  }

  function updateMonth() {
    var cal=this
    var updateMonthURL="http://"+calHost+"/php/commit_month_changes.php"
    ocjq.ajax({
      traditional: true,
      type: 'POST',
      url: updateMonthURL,
      async: false,
      dataType: 'text',
      data: cal.monthChanges,
      success: function(data) {
	cal.buildCal(cal.curMonth,cal.curYear)
	cal.display()
	ocjq("#legend").fadeIn()
      }
    })

  }

  function cancelMonthEdit() {
    var cal=this
    cal.buildCal(cal.curMonth,cal.curYear)
    cal.display()
    ocjq("#legend").fadeIn()
  }

  function editGroupDialog(gid) {
    var cal=this
    var groupInfo=getGroupInfo(gid)
    ocjq("#edit_group").dialog({
      autoOpen: false,
      closeOnEscape: true,
      modal: true,
      resizable: true,
      title: 'Editing Group Info for '+cal.groupList[gid].name,
      width: "75%",
      height: 400,
      position: {my: "center top", at: "center top+75", of: "#cal_container"},
      buttons: [{
	text: "Save Changes",
	click: function() {
	  var updateGroupChangelist = ocjq("#edit_group_form").serializeArray()
	  cal.updateGroupInfo(updateGroupChangelist,gid)
	}
      },
      {
	text: "Cancel",
	click: function() {
	  ocjq(this).dialog("close")
	}
      }]
    })
    ocjq("#edit_group").empty()
    ocjq("#edit_group").append('<form id="edit_group_form" method="GET" action=""></form>')
    ocjq("#edit_group_form").append('<div id="eg_rt" class="eg_divs"></div>')
    ocjq("#eg_rt").append('<span class="edit_group_item">Default rotation time:</span>')
    ocjq("#eg_rt").append('<select id="eg_t_hour" name="turnover_hour"></select>\n')
    var h=0
    while(h < 24) {
      if(h==cal.groupList[gid].turnover_hour) {
	ocjq("#eg_t_hour").append('<option value="'+h+'" selected="selected">'+sanitize(h)+'</option>\n')
      } else {
	ocjq("#eg_t_hour").append('<option value="'+h+'">'+sanitize(h)+'</option>\n')
      }
      h++
    }
    ocjq("#eg_rt").append('<select id="eg_t_min" name="turnover_min">\n')
    ocjq("#eg_t_min").append('<option value="0">0</option>\n')
    if(cal.groupList[gid].turnover_min==30) {
      ocjq("#eg_t_min").append('<option value="30" selected="selected">30</option>\n')
    } else {
      ocjq("#eg_t_min").append('<option value="30">30</option>\n')
    }
    ocjq("#edit_group_form").append('<div id="eg_ar" class="eg_divs"></div>')
    ocjq("#eg_ar").append('<span class="edit_group_item">Auto Rotate Zenoss paging?</span>')
    ocjq("#eg_ar").append('<input type="radio" name="autorotate" value="1" id="ar1"/><label for="ar1">Yes</label>')
    ocjq("#eg_ar").append('<input type="radio" name="autorotate" value="0" id="ar2"/></label for="ar2">No</label>')
    if(cal.groupList[gid].autorotate==1) {
      ocjq('input:radio[name=autorotate]').filter('[value="1"]').attr('checked',true)
    } else {
      ocjq('input:radio[name=autorotate]').filter('[value="0"]').attr('checked',true)
    }
    ocjq("#edit_group_form").append('<div id="eg_email" class="eg_divs"></div>')
    ocjq("#eg_email").append('<span class="edit_group_item">Group contact email:</span>')
    ocjq("#eg_email").append('<input type="text" size="80" name="email" value="'+cal.groupList[gid].email+'"/>')
    ocjq("#edit_group_form").append('<div id="eg_alias" class="eg_divs"></div>')
    ocjq("#eg_alias").append('<span class="edit_group_item">Pager alias for the on-call:</span>')
    ocjq("#eg_alias").append('<input type="text" size="20" name="alias" value="'+cal.groupList[gid].alias+'"/>')
    ocjq("#eg_alias").append('<span class="edit_group_item">@oncall.leanlogistics.com</span>')
    ocjq("#edit_group_form").append('<div id="eg_backup" class="eg_divs"></div>')
    ocjq("#eg_backup").append('<span class="edit_group_item">Set a backup alias for the on-call?</span>')
    ocjq("#eg_backup").append('<input type="radio" name="backup" value="1" id="bu1"/><label for="bu1">Yes</label>')
    ocjq("#eg_backup").append('<input type="radio" name="backup" value="0" id="bu2"/><label for="bu2">No</label>')
    if(cal.groupList[gid].backup==1) {
      ocjq('input:radio[name=backup]').filter('[value="1"]').attr('checked',true)
    } else {
      ocjq('input:radio[name=backup]').filter('[value="0"]').attr('checked',true)
    }
    ocjq("#eg_backup").append('<input type="text" size="20" name="backup_alias" value="'+cal.groupList[gid].backup_alias+'"/>')
    ocjq("#eg_backup").append('<span class="edit_group_item">@oncall.leanlogistics.com</span>')
    ocjq("#edit_group_form").append('<div id="eg_failsafe" class="eg_divs"></div>');
    ocjq("#eg_failsafe").append('<span class="edit_group_item">Set a failsafe alias for the oncall?</span>')
    ocjq("#eg_failsafe").append('<input type="radio" name="failsafe" value="1" id="fs1" /><label for="fs1">Yes</label>')
    ocjq("#eg_failsafe").append('<input type="radio" name="failsafe" value="0" id="fs2" /><label for="fs2">No</label>')
    if(cal.groupList[gid].failsafe==1) {
      ocjq('input:radio[name=failsafe]').filter('[value="1"]').attr('checked', true)
    } else {
      ocjq('input:radio[name=failsafe]').filter('[value="0"]').attr('checked', true)
    }
    ocjq("#eg_failsafe").append('<input type="text" size="20" name="failsafe_alias" value="'+cal.groupList[gid].failsafe_alias+'"/>')
    ocjq("#eg_failsafe").append('<span class="edit_group_item">@oncall.leanlogistics.com</span>')
    ocjq("#edit_group_form").append('<div id="eg_save_button" class="eg_divs"></div>')
    ocjq("#edit_group").dialog("open")
  }

  function updateGroupInfo(changes,group) {
    var cal=this
    var dbUpdates=new Array()
    var c=0
    ocjq.each(changes, function(k,change) {
      if(change.value != cal.groupList[group][change.name]) {
	dbUpdates[c]=change.name+'='+change.value
	c++
      }
    })
    if(dbUpdates.length < 1) {
      ocjq("#edit_group").dialog("close")
    } else {
      var dbUpString=''
      var i=1;
      while(i < dbUpdates.length) {
	dbUpString+=dbUpdates[i-1]+', '
	i++
      }
      dbUpString+=dbUpdates[i-1]
    }
    groupUpdateData={}
    groupUpdateData['g']=group
    groupUpdateData['q']=dbUpString
    var updateGroupInfoURL='http://'+calHost+'/php/commit_group_info_changes.php'
    ocjq.ajax({
      traditional: true,
      type: 'POST',
      url: updateGroupInfoURL,
      async: false,
      dataType: 'text',
      data: groupUpdateData,
      success: function(data) {
	ocjq("#edit_group").dialog("close")
	ocjq("#legend").accordion("destroy")
	ocjq("#legend").empty()
	cal.buildLegend()
	ocjq("#edit_group").empty()
      }
    })
  }

  function editGroupMembersDialog(gid) {
    var cal=this
    var groupMembers=getGroupMembers(gid)
    var gmemChanges=new Object()
    gmemChanges.num=0
    ocjq("#edit_gmem").dialog({
      autoOpen: false,
      closeOnEscape: true,
      modal: true,
      resizable: true,
      title: "Editing Members For Group: "+cal.groupList[gid].name,
      width: "75%",
      height: 400,
      position: {my: "center top", at: "center top+75", of: "#cal_container"},
      buttons: [{
        text: "Save Changes",
        click: function() {
          cal.updateGroupMembers(gmemChanges,gid)
        }
      },
      {
        text: "Done",
        click: function() {
          ocjq("#edit_gmem").dialog("close")
	  ocjq("#legend").accordion("destroy")
	  ocjq("#legend").empty()
	  cal.buildLegend()
	  ocjq("#edit_gmem").empty()
        }
      }]
    })
    ocjq("#edit_gmem").empty()
    ocjq("#edit_gmem").append('<form id="edit_gmem_form" method="GET" action=""></form>')
    ocjq("#edit_gmem_form").append('<div class="gmems"></div>')
    ocjq("#edit_gmem_form").append('<div id="edit_gmem_header"></div>')
    ocjq("#edit_gmem_header").append('<span id="active">Active</span><span id="username">Username</span><span id="first">First Name</span><span id="last">Last Name</span><span id="phone">Phone</span><span id="sms_email">SMS email</span>')
    ocjq.each(groupMembers, function(k,v) {
      ocjq("#edit_gmem_form").append('<div id="gmem_'+k+'" class="edit_gmem_input"></div>')
      ocjq("#gmem_"+k).append('<input type="checkbox" userid="'+k+'" id="active_'+k+'" name="active" value="yes"/>')
      if(v[4]==1) {
        ocjq('input:checkbox[id=active_'+k+']').attr('checked',true)
      }
      ocjq("#gmem_"+k).append('<input type="text" userid="'+k+'" id="username_'+k+'" class="gmem_username_input" size="20" name="username" value="'+v[2]+'"/>')
      ocjq("#gmem_"+k).append('<input type="text" userid="'+k+'" id="first_'+k+'" class="gmem_firstname_input" size="20" name="firstname" value="'+v[0]+'"/>')
      ocjq("#gmem_"+k).append('<input type="text" userid="'+k+'" id="last_'+k+'" class="gmem_lastname_input" size="20" name="lastname" value="'+v[1]+'"/>')
      ocjq("#gmem_"+k).append('<input type="text" userid="'+k+'" id="phone_'+k+'" class="gmem_phone_input" size="11" name="phone" value="'+v[3]+'"/>')
      ocjq("#gmem_"+k).append('<input type="text" userid="'+k+'" id="smsemail_'+k+'" class="gmem_smsemail_input" size="30" name="sms_email" value="'+v[5]+'"/>')
      ocjq("#gmem_"+k).append('<input type="checkbox" userid="'+k+'" id="delete_'+k+'" name="delete" value="delete"/><label for="delete_'+k+'">Delete '+v[0]+'?</label>')
    })
    ocjq("#edit_gmem_form").append('<div id="gmem_newuser" class="edit_gmem_input"></div>')
    ocjq("#gmem_newuser").append('<input type="checkbox" userid="newuser" id="new_active" name="active" value="yes" style="margin: 0 10px 0 15px;"/>')
    ocjq("#gmem_newuser").append('<input type="text" userid="newuser" id="new_username" class="gmem_username_input" size="20" name="username"/>')
    ocjq("#gmem_newuser").append('<input type="text" userid="newuser" id="new_firstname" class="gmem_firstname_input" size="20" name="firstname"/>')
    ocjq("#gmem_newuser").append('<input type="text" userid="newuser" id="new_lastname" class="gmem_lastname_input" size="20" name="lastname"/>')
    ocjq("#gmem_newuser").append('<input type="text" userid="newuser" id="new_phone" class="gmem_phone_input" size="11" name="phone"/>')
    ocjq("#gmem_newuser").append('<input type="text" userid="newuser" id="new_smsemail" class="gmem_smsemail_input" size="30" name="sms_email"/>')
    ocjq("input").change(function() {
      if(ocjq(this).attr("type")=="checkbox") {
        if(this.checked) {
          ocjq(this).attr('value',"1")
        } else {
          ocjq(this).attr('value',"0")
        }
      }
      var id=ocjq(this).attr('userid')
      if(typeof gmemChanges[id]=="undefined") {
        gmemChanges[id]={}
      }
      gmemChanges[id][this.name]=this.value
      if(ocjq(this).attr('name')=="delete") {
        gmemChanges[id]['firstname']=groupMembers[id][0]
      }
      gmemChanges.num+=1
    })
    ocjq("#edit_gmem").dialog("open")
    ocjq('input[type="text"]').css('margin-left', '5px')
    ocjq('input[name="active"]').css('margin', function(index, value) {
      var marg=((ocjq("#active").outerWidth()-ocjq(this).width())/2)
      return("0 "+marg+"px 0 "+marg+"px")
    })
    ocjq("#username").css('padding-right', function(index, value) {
      var pad=(ocjq('input[name="username"]').outerWidth()-(ocjq(this).width()))
      return(pad+"px")
    })
    ocjq("#first").css('padding-right', function(index, value) {
      var pad=(ocjq('input[name="firstname"]').outerWidth()-(ocjq(this).width()))
      return(pad+"px")
    })
    ocjq("#last").css('padding-right', function(index, value) {
      var pad=(ocjq('input[name="lastname"]').outerWidth()-(ocjq(this).width()))
      return(pad+"px")
    })
    ocjq("#phone").css('padding-right', function(index, value) {
      var pad=(ocjq('input[name="phone"]').outerWidth()-(ocjq(this).width()))
      return(pad+"px")
    })
    ocjq("#sms_email").css('padding-right', function(index, value) {
      var pad=(ocjq('input[name="sms_email"]').outerWidth()-(ocjq(this).width()))
      return(pad+"px")
    })
  }

  function updateGroupMembers(changes, group) {
    var cal=this
    var gmemChangeMaster={}
    if(changes.num < 1) {
      alert("no changes to make")
      return
    } else {
      delete(changes.num)
      if(typeof changes.newuser !== "undefined") {
        var dbUpString=''
        gmemChangeMaster.newuser={}
        if(changes.newuser.active!="1") {
          changes.newuser.active="0"
        }
	gmemChangeMaster.newuser.active=changes.newuser.active
        var missing=[]
        var reqs={"username":"User Name","firstname":"First Name","lastname":"Last Name","phone":"Phone","active":"Active","sms_email":"SMS email"}
        for(var req in reqs) {
          if(typeof changes.newuser[req]=="undefined") {
            missing.push(reqs[req])
          } else {
            dbUpString+="'"+changes.newuser[req]+"',"
          }
        }
        var victimInfo=getVictimInfo("username",changes.newuser.username)
        if(victimInfo['id']=="Not Found") {
	  if(missing.length > 0) {
	    alert("Please fill in the following fields for the user you are trying to create:\n"+missing.join(", "))
	    return
	  } else {
	    gmemChangeMaster.newuser.type="insert"
	    gmemChangeMaster.newuser.table="victims"
	    gmemChangeMaster.newuser.group=group
	    gmemChangeMaster.newuser.username=changes.newuser.username
	    dbUpString=dbUpString.substring(0,dbUpString.length-1)
	    gmemChangeMaster.newuser.dbUpString=dbUpString
	  }
	} else {
          gmemChangeMaster.newuser.type="insert"
          gmemChangeMaster.newuser.table="groupmap"
          gmemChangeMaster.newuser.dbUpString=group+", "+victimInfo.id
          alert("An oncall record for "+victimInfo.firstname+" already exists, adding them to your group")
        } 
        delete(changes.newuser)
        gmemChangeMaster.newuser=JSON.stringify(gmemChangeMaster.newuser)
      }
      ocjq.each(changes, function(k,change) {
        gmemChangeMaster[k]={}
	if(typeof this.active !== "undefined") {
	  gmemChangeMaster[k].active=this.active
	  delete(this.active)
	}
        if(this.delete=="1") {
          if(confirm("Are you sure you want to delete "+this.firstname+"?")) {
            gmemChangeMaster[k].type="delete"
            gmemChangeMaster[k].table="groupmap"
            gmemChangeMaster[k].dbUpString="userid='"+k+"' AND groupid='"+group+"'"
          }
        } else {
          var dbUpString=''
          ocjq.each(change, function(c,v) {
            dbUpString+=c+"='"+v+"',"
          })
          dbUpString=dbUpString.substring(0,dbUpString.length-1)
          gmemChangeMaster[k].type="update"
          gmemChangeMaster[k].table="victims"
	  gmemChangeMaster[k].userid=k
	  gmemChangeMaster[k].group=group
          gmemChangeMaster[k].where="id='"+k+"'"
          gmemChangeMaster[k].dbUpString=dbUpString
        }
        gmemChangeMaster[k]=JSON.stringify(gmemChangeMaster[k])
      })
      var groupMemUpdateURL='http://'+calHost+'/php/commit_group_member_changes.php'
      ocjq.ajax({
        traditional: true,
        type: 'POST',
        url: groupMemUpdateURL,
        async: false,
        dataType: 'text',
        data: gmemChangeMaster,
        success: function(data) {
	  if(data.length > 0) {
	    alert(data)
	  }
          alert("Changes have been saved")
        }
      })
    }
    cal.editGroupMembersDialog(group)
  }
}

function displayCalendar(calObj) {
//  ocjq("#cal_head").html('<div id="prelink" onClick="this.buildCal('+prevMonth+','+calObj.curYear+')">Previous</div><div id="month_name"><h2>'+monthStrings[calObj.curMonth]+' '+calObj.curYear+'</h2></div><div id="Next" onClick="this.buildCal('+nextMonth+','+calObj.curYear+')">Next</div>')
  ocjq("#month_name").html('<h3>'+monthStrings[calObj.curMonth]+' '+calObj.curYear+'</h3>')
  ocjq("#month_name h3").css("color", "white")
  ocjq("#prev").mouseover(function() {
    ocjq("#prev").addClass("ui-state-hover")
    ocjq("#prev").css({"cursor":"pointer"})
  })
  ocjq("#prev").mouseout(function() {
    ocjq("#prev").removeClass("ui-state-hover")
  })
  ocjq("#next").mouseover(function() {
    ocjq("#next").addClass("ui-state-hover")
    ocjq("#next").css({"cursor":"pointer"})
  })
  ocjq("#next").mouseout(function() {
    ocjq("#next").removeClass("ui-state-hover")
  })
  var calWeek = 1
  var wdCount = calObj.firstDayNum
  if(calObj.curMonth == calObj.now.getMonth()) {
    var today = calObj.now.getDate()
    if(today < 10) {
      today = '0'+today
    }
  }
  ocjq("#calendar_grid").append('<div id="week'+calWeek+'" class="calweek"></div>\n')
  if(calObj.firstDayNum > 0) {
    ocjq.each(calObj.preVictims, function(v,victimData) {
      var dayDiv = '<div class="day grey ui-widget-content ui-state-disabled">\n'
      dayDiv += '<h4>'+victimData[0][0]+'</h4>\n'
      ocjq.each(victimData, function(k,data) {
	dayDiv += '<p class="gmem'+data[2]+' victim" onClick="'+calObj.name+'.editDay('+calObj.prevMonthYear+','+calObj.prevMonth+','+victimData[0][0]+','+data[2]+')" style="color:'+groupColors[data[2]]+'">'+data[1]+' - '+data[3]+'</p>\n'
      });
      dayDiv += '</div>\n'
      ocjq("#week"+calWeek).append(dayDiv)
    });
  }
  ocjq.each(calObj.victims, function(v,victimData) {
    if(wdCount == 7) {
      ocjq("#week"+calWeek).append('<div class="clear"></div>')
      calWeek++
      wdCount=0
      ocjq("#calendar_grid").append('<div id="week'+calWeek+'" class="calweek"></div>\n')
    }
    if(victimData[0][0] == today) {
      var dayDiv = '<div class="day today ui-state-highlight">\n'
    } else if(wdCount == 0) {
      var dayDiv = '<div class="day sunday ui-widget-content ui-state-hover">\n'
    } else if(wdCount == 6) {
      var dayDiv = '<div class="day saturday ui-widget-content ui-state-hover">\n'
    } else {
      var dayDiv = '<div class="day ui-widget-content ui-state-active">\n'
    }
    dayDiv += '<h4>'+victimData[0][0]+'</h4>\n'
    ocjq.each(victimData, function(k,data) {
      dayDiv += '<p class="gmem'+data[2]+' victim" onClick="'+calObj.name+'.editDay('+calObj.curYear+','+calObj.curMonth+','+victimData[0][0]+','+data[2]+')" style="color:'+groupColors[data[2]]+'">'+data[1]+' - '+data[3]+'</p>\n'
    });
    dayDiv += '</div>\n'
    ocjq("#week"+calWeek).append(dayDiv)
    wdCount++
  });
  if(calObj.lastDayNum < 6) {
    var k = Object.keys(calObj.postVictims)
    var l = k.length
    var s = k[l-1]
    ocjq.each(calObj.postVictims, function(v,victimData) {
      if(v==s) {
	var dayDiv = '<div class="day saturday grey ui-widget-content ui-state-disabled">\n'
      } else {
	var dayDiv = '<div class="day grey ui-widget-content ui-state-disabled">\n'
      }
      dayDiv+='<h4>'+victimData[0][0]+'</h4>'
      ocjq.each(victimData, function(k,data) {
	dayDiv += '<p class="gmem'+data[2]+' victim" onClick="'+calObj.name+'.editDay('+calObj.nextMonthYear+','+calObj.nextMonth+','+victimData[0][0]+','+data[2]+')" style="color:'+groupColors[data[2]]+'">'+data[1]+' - '+data[3]+'</p>\n'
      });
      dayDiv+='</div>\n'
      ocjq("#week"+calWeek).append(dayDiv)
    });
  }
  ocjq("#week"+calWeek).append('<div class="clear"></div>')
  ocjq("#calendar_grid").append('</div>')
  ocjq(".day p").hover(function() {
    ocjq(".day p").css({"cursor":"pointer", "font-size":"10pt", "font-weight":"bold"})
  })
  ocjq('.ghide').each( function() {
    var toggle=this.value
    if(this.checked) {
      ocjq("."+toggle).hide()
    }
  })
  ocjq('.ohide').each( function() {
    var otoggle=this.value
    if(this.checked) {
      ocjq(".victim").not("."+otoggle).fadeOut()
    }
  })
  return
}

function displayMonthEditCalendar(calObj) {
  ocjq("#month_name").html('<h3>'+monthStrings[calObj.curMonth]+' '+calObj.curYear+'</h3>')
  var calWeek=1
  var wdCount=calObj.firstDayNum
  if(calObj.editGroupInfo.t_hour < 10) {
    var turnH = '0'+calObj.editGroupInfo.t_hour
  } else {
    var turnH = calObj.editGroupInfo.t_hour
  }
  if(calObj.editGroupInfo.t_min > 0) {
    var turnM = calObj.editGroupInfo.t_min
  } else {
    var turnM = '00'
  }
  calObj.monthChanges['t']=calObj.editGroupInfo.t_hour+':'+calObj.editGroupInfo.t_min
  if(calObj.curMonth==calObj.now.getMonth()) {
    var today=sanitize(calObj.now.getDate())
  }
  var turn=turnH+":"+turnM
  var csv=''
  ocjq("#calendar_grid").append('<form id="edit_month_form" action="" method="GET">\n')
  ocjq("#calendar_grid").append('<div id="week'+calWeek+'"></div>')
  if(calObj.firstDayNum > 0) {
    ocjq.each(calObj.preDailyVictims, function(v,victimData) {
      var dayDiv='<div class="day grey ui-widget-content ui-state-disabled">\n'
      dayDiv += '<h4>'+victimData[0][0]+'</h4>\n'
      dayDiv += '<select id="'+victimData[0][0]+'-'+calObj.prevMonth+'-'+calObj.prevMonthYear+'">\n'
      if(victimData.length == 1) {
	csv=victimData[0][3]
	if(csv.length==0) {
	  dayDiv+='<option value="--" selected="selected">----</option>\n'
	}
      } else if(victimData.length == 2) {
	csv=victimData[1][3]
      } else if(victimData.length > 2) {
	var i=0
	while(i < victimData.length) {
	  if(victimData[i][1] == turn) {
	    csv=victimData[i][3]
	  }
	  i++
	}
      }
      ocjq.each(calObj.editGroupMembers, function(k,v) {
	if(v[4]==1) {
	  if(csv==v[0]) {
	    dayDiv+='<option value="'+k+'" selected="selected">'+v[0]+'</option>\n'
	  } else {
	    dayDiv+='<option value="'+k+'">'+v[0]+'</option>\n'
	  }
	}
      })
      dayDiv+='</select>\n'
      dayDiv+='</div>\n'
      ocjq("#week"+calWeek).append(dayDiv)
    })
  }
  ocjq.each(calObj.editDailyVictims, function(v,victimData) {
    if(wdCount==7) {
      ocjq("#week"+calWeek).append('<div class="clear"></div>')
      calWeek++
      wdCount=0
      ocjq("#calendar_grid").append('<div id="week'+calWeek+'" class="calweek"></div>\n')
    }
    if(victimData[0][0] == today) {
      var dayDiv='<div class="day today ui-state-highlight">\n'
    } else if(wdCount == 0) {
      var dayDiv='<div class="day sunday ui-widget-content ui-state-hover">\n'
    } else if(wdCount == 6) {
      var dayDiv='<div class="day saturday ui-widget-content ui-state-hover">\n'
    } else {
      var dayDiv='<div class="day ui-widget-content ui-state-active">\n'
    }
    dayDiv+='<h4>'+victimData[0][0]+'</h4>\n'
    dayDiv+='<select id="'+victimData[0][0]+'-'+calObj.curMonth+'-'+calObj.curYear+'">\n'
    if(victimData.length == 1) {
      csv=victimData[0][3]
      if(csv.length==0) {
	dayDiv+='<option value="--" selected="selected">----</option>\n'
      }
    } else if(victimData.length == 2) {
      csv=victimData[1][3]
    } else if(victimData.length > 2) {
      var i=0
      while(i < victimData.length) {
	if(victimData[i][1] == turn) {
	  csv=victimData[i][3]
	}
	i++
      }
    }
    ocjq.each(calObj.editGroupMembers, function(k,v) {
      if(v[4]==1) {
	if(csv==v[0]) {
	  dayDiv+='<option value="'+k+'" selected="selected">'+v[0]+'</option>\n'
	} else {
	  dayDiv+='<option value="'+k+'">'+v[0]+'</option>\n'
	}
      }
    })
    dayDiv+='</select>\n'
    dayDiv+='</div>\n'
    ocjq("#week"+calWeek).append(dayDiv)
    wdCount++
  })
  if(calObj.lastDayNum < 6) {
    var k = Object.keys(calObj.postVictims)
    var l = k.length
    var s = k[l-1]
    ocjq.each(calObj.postDailyVictims, function(v,victimData) {
      if(v==s) {
	var dayDiv = '<div class="day saturday grey ui-widget-content ui-state-disabled">\n'
      } else {
	var dayDiv='<div class="day grey ui-widget-content ui-state-disabled">\n'
      }
      dayDiv += '<h4>'+victimData[0][0]+'</h4>\n'
      dayDiv += '<select id="'+victimData[0][0]+'-'+calObj.nextMonth+'-'+calObj.nextMonthYear+'">\n'
      if(victimData.length == 1) {
	csv=victimData[0][3]
	if(csv.length==0) {
	  dayDiv+='<option value="--" selected="selected">----</option>\n'
	}
      } else if(victimData.length == 2) {
	csv=victimData[1][3]
      } else if(victimData.length > 2) {
	var i=0
	while(i < victimData.length) {
	  if(victimData[i][1] == turn) {
	    csv=victimData[i][3]
	  }
	  i++
	}
      }
      ocjq.each(calObj.editGroupMembers, function(k,v) {
	if(v[4]==1) {
	  if(csv==v[0]) {
	    dayDiv+='<option value="'+k+'" selected="selected">'+v[0]+'</option>\n'
	  } else {
	    dayDiv+='<option value="'+k+'">'+v[0]+'</option>\n'
	  }
	}
      })
      dayDiv+='</select>\n'
      dayDiv+='</div>\n'
      ocjq("#week"+calWeek).append(dayDiv)
    })
  }
  ocjq("#week"+calWeek).append('<div class="clear"></div>')
  ocjq("#calendar_grid").append('<div id="editMonthButtons"></div>')
  ocjq("#calendar_grid").append('</form>\n')
  ocjq("#calendar_grid").append('<div class="clear"></div>')
  ocjq("select").change(function() {
    var cs = ocjq(this).attr('id')
    var vId = ocjq(this).attr('value')
    calObj.monthChanges[cs]=vId
  })
  ocjq("#editMonthButtons").append('<button id="commitMonthEdit" onClick="'+calObj.name+'.updateMonth()">Save Changes</button>\n')
  ocjq("#editMonthButtons").append('<button id="cancelMonthEdit" onClick="'+calObj.name+'.cancelMonthEdit()">Cancel</button>\n')
//  ocjq("#edit_month_form").append('<button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" name="submit" value="Save Changes" onClick="'+calObj.name+'.updateMonth()"><span class="ui-button-text">Save Changes</button>\n')
//  ocjq("#edit_month_form").append('<button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" name="cancel" value="Cancel" onclick="'+calObj.name+'.cancelMonthEdit()"><span class="ui-button-text">Cancel</button>\n')

  ocjq("#commitMonthEdit").button()
  ocjq("#cancelMonthEdit").button()
}

function sanitize(digit) {
  if(digit<=9) {
    var digit = "0"+digit
  }
  return(digit)
}

function getVictims(y,m,d,p,g) {
  var getVictimsURL = "http://"+calHost+"/php/get_victims.php?year="+y+"&month="+m
  var victimLoad
  if(typeof p !== "undefined") {
    if(typeof d !== "undefined") {
      getVictimsURL = getVictimsURL+"&day="+d+"&p="+p
    }
  }
  if(typeof g !== "undefined") {
    getVictimsURL = getVictimsURL+"&g="+g
  }
  ocjq.ajax({
    url: getVictimsURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      victimLoad = data
    }
  });
  return(victimLoad)
}

function getGroupVictims(gid) {
  var getGVURL = "http://"+calHost+"/php/get_group_victims.php?g="+gid
  var vList
  ocjq.ajax({
    url: getGVURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      vList = data
    }
  })
  return(vList)
}

function getGroupInfo(gid) {
  var getGroupInfoURL = "http://"+calHost+"/php/get_groupinfo.php?g="+gid
  var gname
  ocjq.ajax({
    url: getGroupInfoURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      gname=data
    }
  })
  return(gname)
}

function getGroupMembers(gid) {
  var getGroupMembersURL = 'http://'+calHost+'/php/get_groupmembers.php?g='+gid
  var members
  ocjq.ajax({
    url: getGroupMembersURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      members=data
    }
  })
  return(members)
}

function getGroupList() {
  var getGroupListURL = 'http://'+calHost+'/php/get_grouplist.php'
  var groups
  ocjq.ajax({
    url: getGroupListURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      groups=data
    }
  })
  return(groups)
}

function getVictimInfo(col,value) {
  var getVictimInfoURL='http://'+calHost+'/php/get_victim_info.php?col='+col+'&value='+value
  var victim
  ocjq.ajax({
    url: getVictimInfoURL,
    data: {},
    dataType: 'json',
    async: false,
    success: function(data) {
      victim=data
    }
  })
  return(victim)
}

function getAllVictims() {
  var getAllVictimsURL='http://'+calHost+'/php/get_allvictims.php'
  var victims
  ocjq.ajax({
    url: getAllVictimsURL,
    data: {},
    dataType: 'json',
    async: false,
    success: function(data) {
      victims=data
    }
  })
  return(victims)
}

function getGroupMap() {
  var getGroupMapURL='http://'+calHost+'/php/get_groupmap.php'
  var gmap
  ocjq.ajax({
    url: getGroupMapURL,
    async: false,
    data: {},
    dataType: 'json',
    success: function(data) {
      gmap=data
    }
  })
  return(gmap)
}

function hideDiv(divId) {
  ocjq("#"+divId).animate({opacity:0.0}, 500)
}

function showDiv(divId) {
  ocjq("#"+divId).animate({opacity:1.0}, 500)
}

Object.keys = Object.keys || (function(o) {
  var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
      DontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      DontEnumsLength = DontEnums.length
  return function(o) {
    if(typeof o != "object" && typeof o != "function" || o === null) {
      throw new TypeError("Object.keys called on a non-object")
    }
    var result = []
    for(var name in o) {
      if(hasOwnProperty.call(o,name)) {
        result.push(name)
      }
      if(hasDontEnumBug) {
        for(var i=0; i < DontEnumsLength; i++) {
          if(hasOwnProperty.call(o, DontEnums[i])) {
            result.push(DontEnums[i])
          }
        }
      }
    }
  return(result)
  }
})()

