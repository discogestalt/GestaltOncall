#!/usr/bin/perl

use DBI;
use Date::Parse;
use Date::Calc qw(Days_in_Month Month_to_Text Week_of_Year Day_of_Week Add_Delta_Days);
use CGI;

# Create CGI object
$cgi = new CGI;

# Get the current date and save the parts to an array
my $now = localtime();
($nDay, $nMonth, $nYear) = (strptime($now))[3,4,5];
$nMonth += 1;
$nYear += 1900;
(@now) = ($nYear, $nMonth, $nDay);

# Check to see if we're called with a month and/or year, otherwise
# default to the current month and year
if(($cgi->url_param('month')) || ($cgi->param('month')) || ($cgi->param('go_month'))) {
  if($cgi->url_param('month')) {
    $displayMonth = $cgi->url_param('month')
  } elsif($cgi->url_param('month')) {
    $displayMonth = $cgi->param('month');
  } elsif($cgi->param('go_month')) {
    $displayMonth = $cgi->param('go_month');
  }
} else {
  $displayMonth = $now[1];
}
if(($cgi->url_param('year')) || ($cgi->param('year')) || ($cgi->param('go_month'))) {
  if($cgi->url_param('year')) {
    $displayYear = $cgi->url_param('year')
  } elsif( $cgi->param('year')) {
    $displayYear = $cgi->param('year');
  } elsif($cgi->param('go_year')) {
    $displayYear = $cgi->param('year');
  }
} else {
  $displayYear = $now[0];
}

%months = ('01'=>'January',
           '02'=>'February',
	   '03'=>'March',
	   '04'=>'April',
	   '05'=>'May',
	   '06'=>'June',
	   '07'=>'July',
	   '08'=>'August',
	   '09'=>'September',
	   '10'=>'October',
	   '11'=>'November',
	   '12'=>'December');

# Some default colors for the group key in the calendar
@groupColors = ("","blue", "purple", "red", "green", "goldenrod", "teal", "darkorchid", "orangered", "olivedrab", "orange");

# How many days are there in this month?
$displayDays = Days_in_Month($displayYear, $displayMonth);
# String to match the year and month in the database
$searchString = sprintf("%4d-%02d", $displayYear, $displayMonth);
# What day of the week does the first of the month fall on?
$firstDay = Day_of_Week($displayYear,$displayMonth,1);
# What day of the week does the last of the month fall on?
$lastDay = Day_of_Week($displayYear,$displayMonth,$displayDays);

# The month, in text
$monthString = Month_to_Text($displayMonth);

# create database connection object
$mysql = DBI->connect('DBI:mysql:oncall;host=io.leanlogistics.com','oncall','oncall') || die "Couldn't connect to database: $DBI::errstr";

# If the first day of the month is a Sunday we're good to go, otherwise
# we need to get some days from the previous month to fill in
if($firstDay == 7) {
# Even if we don't need days from the previous month for the calendar, we
# still need to know what the previous month is
  if($displayMonth == 1) {
    $preMonth = 12;
    $preYear = $displayYear - 1;
# If it's not January, we just subtract one, year is the same
  } else {
    $preMonth = $displayMonth - 1;
    $preYear = $displayYear;
  }
} else {
# How many days do we need?
  $preDays = $firstDay;
# If this is January, last month is December, and the year is different too
  if($displayMonth == 1) {
    $preMonth = 12;
    $preYear = $displayYear - 1;
# If it's not January, we just subtract one, year is the same
  } else {
    $preMonth = $displayMonth - 1;
    $preYear = $displayYear;
  }
# How many days are there in the previous month?
  $preMonthLength = Days_in_Month($preYear,$preMonth);
# Find the day we start the search from 
  (@preStartDay) = Add_Delta_Days($preYear,$preMonth,$preMonthLength,-($preDays-1));
# And set up the search string to pull entries from that day
  $preSearch = sprintf("'%4d-%02d-%02d\%'", $preYear,$preMonth,$preStartDay[2]);
# Save it in a string too, we'll need it later
  $dayString = sprintf("%4d-%02d-%02d", $preYear,$preMonth,$preStartDay[2]);
# In fact, save that string in an array
  push(@days, $dayString);
# This day isn't in the current display month, make note of it
  $outDays{$dayString} = 1;
# Now we loop through and do the same with the rest of the days we need
  for($pd = ($preStartDay[2] + 1); $pd <= $preMonthLength; $pd++) {
    $preSearch .= sprintf(" or c.slot like '%4d-%02d-%02d\%'", $preYear,$preMonth,$pd);
    $dayString = sprintf("%4d-%02d-%02d", $preYear,$preMonth,$pd);
    push(@days, $dayString);
    $outDays{$dayString} = 1;
  }
# Create a query object for the previous month data
  $preq = $mysql->prepare("SELECT c.slot, c.groupid, v.firstname from calendar c, victims v where (c.slot like $preSearch) and v.id=c.victimid order by c.slot, c.groupid");
# And execute it
  $preq->execute() or die DBI->errstr;
# Loop through the results
  while($preResult = $preq->fetchrow_arrayref) {
# First column is a timestamp 'YYYY-MM-DD HH:MM:SS', we need the 
# date and time separated
    (my $day, my $slot) = split(/ /, $preResult->[0]);
# Second column is the groupid
    my $group = $preResult->[1];
# Third column is the name of the oncall person for the group
    my $victim = $preResult->[2];
# Have we already seen data for this particular day?
    if( $day eq $workingDay) {
# If we have, is the oncall person the same as it was the previous 1/2 hour slot?
# Is it midnight? That's a special case
      next if(($victim eq $currentVictim{$group}) && ($slot ne "00:00:00"));
# If the oncall person is different (or it's midnight), save that info in a hash
# named for the date
      push(@{$workingDay}, [$slot, $group, $victim, "out"]);
      $currentVictim{$group} = $victim;
    } else {
# We haven't seen data for this day before
      $workingDay = $day;
      $currentVictim{$group} = $victim;
      push(@{$workingDay}, [$slot, $group, $victim, "out"]);
    }
  }
# close out the query object
  $preq->finish();
}

# Now push all the days for the displayed month into that master array
for($cmd = 1; $cmd <= $displayDays; $cmd++) {
  push(@days, sprintf("%4d-%02d-%02d", $displayYear, $displayMonth, $cmd));
}

# Create a query object for the displayed month's data. See above
# for what we're going to do with it
$vq = $mysql->prepare("SELECT c.slot, c.groupid, v.firstname from calendar c, victims v where slot like '$searchString%' and v.id=c.victimid order by c.slot, c.groupid");
$vq->execute() or die DBI->errstr;
while($vResult = $vq->fetchrow_arrayref) {
  (my $day, my $slot) = split(/ /, $vResult->[0]);
  my $group = $vResult->[1];
  my $victim = $vResult->[2];
  if($day eq $workingDay) {
    next if(($currentVictim{$group} eq $victim) && ($slot ne "00:00:00"));
    push(@{$workingDay}, [$slot, $group, $victim, "in"]);
    $currentVictim{$group} = $victim;
  } else {
    $workingDay = $day;
    $currentVictim{$group} = $victim;
    push(@{$workingDay}, [$slot, $group, $victim, "in"]);
  }
}
$vq->finish();

# If the last day of the displayed month isn't a Saturday we need to fill
# in the end of the week with data from the following month
if($lastDay == 6) {
# Again, even if we don't need fill-in days for the calendar, we still need
# to know what next month is
  if($displayMonth == 12) {
    $postMonth = 1;
    $postYear = $displayYear + 1;
  } else {
    $postMonth = $displayMonth + 1;
    $postYear = $displayYear;
  }
} else {
  if($lastDay == 7) {
    $postDays = 6;
  } else {
    $postDays = 6 - $lastDay;
  }
  if($displayMonth == 12) {
    $postMonth = 1;
    $postYear = $displayYear + 1;
  } else {
    $postMonth = $displayMonth + 1;
    $postYear = $displayYear;
  }
  $postSearch = sprintf("'%4d-%02d-%02d\%'", $postYear,$postMonth,1);
  $dayString = sprintf("%4d-%02d-%02d", $postYear,$postMonth,1);
  push(@days, $dayString);
  $outDays{$dayString} = 1;
  for($ad = 2; $ad <= $postDays; $ad++) {
    $postSearch .= sprintf(" or c.slot like '%4d-%02d-%02d\%'", $postYear,$postMonth,$ad);
    $dayString = sprintf("%4d-%02d-%02d", $postYear,$postMonth,$ad);
    push(@days, $dayString);
    $outDays{$dayString} = 1;
  }
  $postq = $mysql->prepare("SELECT c.slot, c.groupid, v.firstname from calendar c, victims v where (c.slot like $postSearch) and v.id=c.victimid order by c.slot, c.groupid");
  $postq->execute() or die DBI->errstr;
  while($postResult = $postq->fetchrow_arrayref) {
    (my $day, my $slot) = split(/ /, $postResult->[0]);
    my $group = $postResult->[1];
    my $victim = $postResult->[2];
    if( $day eq $workingDay) {
      next if(($victim eq $currentVictim{$group}) && ($slot ne "00:00:00"));
      push(@{$workingDay}, [$slot, $group, $victim, "out"]);
      $currentVictim{$group} = $victim;
    } else {
      $workingDay = $day;
      $currentVictim{$group} = $victim;
      push(@{$workingDay}, [$slot, $group, $victim, "out"]);
    }
  }
  $postq->finish();
}

# Create a query object for oncall group info
$gq = $mysql->prepare("SELECT * from groups where active='1'");
$gq->execute() or die DBI->errstr;
# Loop through and save a hash mapping the group id to the group name
while($gqResult = $gq->fetchrow_arrayref) {
  my $groupName = $gqResult->[1];
  ${$groupName}{id} = $gqResult->[0];
  ${$groupName}{turn} = $gqResult->[3];
  ${$groupName}{cv} = $gqResult->[4];
  ${$groupName}{bv} = $gqResult->[5];
  ${$groupName}{auto} = $gqResult->[6];
  ${$groupName}{backup} = $gqResult->[7];
  ${$groupName}{failsafe} = $gqResult->[8];
  ${$groupName}{alias} = $gqResult->[9];
  ${$groupName}{bualias} = $gqResult->[10];
  ${$groupName}{fsalias} = $gqResult->[11];
  ${$groupName}{email} = $gqResult->[12];
  $groupmap{$gqResult->[0]} = $gqResult->[1];
  $groupTurn{$gqResult->[0]} = $gqResult->[3];
  $groupCV{$gqResult->[0]} = $gqResult->[4];
  $groupAuto{$gqResult->[0]} = $gqResult->[6];
  $groupBackup{$gqResult->[0]} 
}
$gq->finish();

# Now we print it all out nice a pretty
# Print out the header
print $cgi->header;
# Print the html head and the start of the body
print $cgi->start_html(-title=>"On-Call Calendar: $monthString, $displayYear", -style=>{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'});

# Javascript to show the info box when an element is clicked on
print <<JS;
  <script language="javascript">
    function showEdit(editDiv) {
      var edit = document.getElementById(editDiv);
      edit.style.visibility = "visible";
    }
    function hideEdit(editDiv) {
      var edit = document.getElementById(editDiv);
      edit.style.visibility = "hidden";
    }
    function showGroupInfo(ginfoDiv) {
      var hiders = document.getElementsByClassName("group_info"),
        n = hiders.length;
      for (var i = 0; i < n; i++) {
	var h = hiders[i];
	if(h.style.display == 'block') {
	  h.style.display = 'none';
	}
      }
      var ginfo = document.getElementById(ginfoDiv);
      ginfo.style.display = "block";
    }
  </script>
JS

# Wrapper div for the calendar, title bar and the week day heads
print "  <div id='calendar_container'>\n";
print "    <table id='calendar' name='calendar' cellspacing='0' width='100%' border='0'>\n";
print "      <tr id='head'>\n";
print "        <td colspan='7'>\n";
print "          <a href='http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl?month=$preMonth&year=$preYear'><img src='http://oncall.leanlogistics.com/images/left_arrow.png' height='30' width='30' alt='Previous Month'></a><span id='month_head'>$monthString $displayYear</span><a href='http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl?month=$postMonth&year=$postYear'><img src='http://oncall.leanlogistics.com/images/right_arrow.png' height='30' width='30' alt='Next Month'></a>\n";
print "        </td>\n";
print "      </tr>\n";
print "      <tr id='weekday_head'>\n";
print "        <th id='sunday' class='dayname'><h4>Sunday</h4></th>\n";
print "        <th id='monday' class='dayname_left'><h4>Monday</h4></th>\n";
print "        <th id='tuesday' class='dayname'><h4>Tuesday</h4></th>\n";
print "        <th id='wednesday' class='dayname'><h4>Wednesday</h4></th>\n";
print "        <th id='thursday' class='dayname'><h4>Thursday</h4></th>\n";
print "        <th id='friday' class='dayname'><h4>Friday</h4></th>\n";
print "        <th id='saturday' class='dayname'><h4>Saturday</h4></th>\n";
print "      </tr>\n";
# And now we loop through all of the days we'll need to populate the calendar
foreach $date (@days) {
  (my $yy, my $mm, my $dd) = (split(/-/, $date));
# Keep track of the week, that's how we'll know to start a new <tr>
# We're cheating and making our week start on Sunday instead of Monday,
# so we have to account for that...
  my $todayIs = Day_of_Week($yy,$mm,$dd);
  ($week, $year) = Week_of_Year($yy,$mm,$dd);
  if($todayIs == 7) {
    if(($mm == 1) && ($week == 52)) {
      $week = 1;
    } else {
      $week += 1;
    }
  } 
# If the date isn't in the displayed month we grey it out
  my $class;
  if($outDays{$date}) {
    $class = "grey_day";
  } else {
    $class = "day";
  }
# If you're looking at the current month, today's date will be
# highlighted in blue
# If it's a weekend (and not the current day) higlight it green
  if($mm == $now[1]) {
    if($dd == $now[2]) {
      $class .= " today";
    } elsif($todayIs > 5) {
      $class .= " weekend";
    }
  } elsif(($todayIs > 5) && (!$outDays{$date})) {
    $class .= " weekend";
  }
# Have we alerady seen data for this week? Then just print the next day
  if($workingWeek == $week) {
    print "      <td class='$class'>\n";
    printf("        <div class='cal_day'><h4>%02d</h4></div>\n", $dd);
    &printChanges($date);
    print "      </td>\n";
# If this is a new week, but it's not the first week of the month, we
# close out the previous <tr>. Otherwise we skip that and just
# print the first day of the week.
  } else {
    if($workingWeek) {
      print "    </tr>\n";
    }
    print "    <tr id='week$week' class='week'>\n";
    print "        <td class='$class day_left'>\n";
    printf("        <div class='cal_day'><h4>%02d</h4></div>\n", $dd);
    &printChanges($date);
    print "       </td>\n";
    $workingWeek = $week;
  }
}
# End the last row, the table and the wrapper div
print "      </tr>\n";
print "    </table>\n";
print "  </div>\n";
print "  <div id='right_col'>\n";
print "    <div id='date_chooser'>\n";
print "      <div id='date_chooser_head'>\n";
print "        <h4>Go to:</h4>\n";
print "      </div> <!-- end div date_chooser_head -->\n";
print "      <div id='date_chooser_body'>\n";
print "        <div id='month_chooser'>\n";
print $cgi->start_form(-action=>'http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl');
print $cgi->popup_menu(-name=>'go_month',
                       -values=>[(sort(keys %months))],
		       -labels=>\%months,
		       -default=>(sprintf("%02d",$now[1])));
print $cgi->popup_menu(-name=>'year',
                       -values=>['2011','2012','2013'],
		       -default=>$nYear);
print $cgi->submit(-name=>'month_chooser', -label=>'Go');
print $cgi->end_form;
print "        </div> <!-- end div month_chooser -->\n";
print "      </div> <!-- end div date_chooser_body -->\n";
print "    </div> <!-- end div date_chooser -->\n";
print "    <div class='clear'></div>\n";
# Print out the group key
print "    <div id='key'>\n";
print "      <div id='key_head'>\n";
print "        <h4>Calendars</h4>\n";
print "      </div> <!-- end div key_head -->\n";
# Give each group a color from that nifty list of colors
foreach $gid (sort keys %groupmap) {
  print "      <div class='group_key' style='background-color: $groupColors[$gid];']>\n";
  print "        <p><span class='group_name' onclick='showGroupInfo(\"info_$gid\")'>$groupmap{$gid}</span></p>\n";
  print "        <div class='clear'></div>\n";
  print "      </div> <!-- end div group_key -->\n";
}
print "    </div> <!-- end div key -->\n";
print "    <div class='clear'></div>\n";
foreach $gid (sort keys %groupmap) {
  my $gName = $groupmap{$gid};
  print "    <div id='info_$gid' class='group_info'>\n";
  print "      <div class='group_info_head' style='background-color: $groupColors[$gid];'>\n";
  print "        <h4>Group Info: $gName</h4>\n";
  print "      </div> <!-- end div group_info_head -->\n";
  print "      <div class='group_info_body'>\n";
  print "        <p><strong>Default Rotation Time:</strong> ${$gName}{turn}</p>\n";
  if(${$gName}{email}) {
    print "        <p><strong>Group contact email address:</strong></p>\n";
    print "        <ul><li><a href='mailto:${$gName}{email}'>${$gName}{email}</a></li></ul>\n";
  }
  if(${$gName}{auto}) {
    if(${$gName}{alias}) {
      print "        <p><strong>On-call pager address:</strong></p>\n";
      print "        <ul><li><a href='mailto:${$gName}{alias}\@oncall.leanlogistics.com'>${$gName}{alias}\@oncall.leanlogistics.com</a></li></ul>\n";
    }
    if(${$gName}{backup}) {
      print "        <p><strong>Backup pager address:</strong></p>\n";
      print "        <ul><li><a href='mailto:${$gName}{bualias}\@oncall.leanlogistics.com'>${$gName}{bualias}\@oncall.leanlogistics.com</a></li></ul>\n";
    }
    if(${$gName}{failsafe}) {
      print "        <p><strong>Panic pager address:</strong></p>\n";
      print "        <ul><li><a href='mailto:${$gName}{fsalias}\@oncall.leanlogistics.com'>${$gName}{fsalias}\@oncall.leanlogistics.com</a></li></ul>\n";
    }
  }
  print "        <p><strong>Group Rotation Members:</strong></p>\n";
  print "        <ul>\n";
  (@vics) = &groupMembers($gid);
  foreach $v (@vics) {
    print "          <li>$v</li>\n";
  }
  print "        </ul>\n";
  print "        <p><strong>Zenoss Auto Rotation:</strong> ";
  print ${$gName}{auto}?"Active":"Inactive";
  print "</p>\n";
  print "        <p><span class='group_edit_link'><a href=\"http://oncall.leanlogistics.com/cgi-bin/edit_month.pl?group=$gid&month=$displayMonth&year=$displayYear\">Edit Month</a></span></p>\n";
  print "        <p><span class='group_info_edit_link'><a href=\"http://oncall.leanlogistics.com/cgi-bin/edit_group.pl?group=$gid\">Edit Group Info</a></span></p>\n";
  print "      </div> <!-- end div group_info_body -->\n";
  print "    </div> <!-- end div info_$group -->\n";
  print "    <div class='clear'></div>\n";
}
print "  </div> <!-- end div right_col -->\n";

# And we're done
print $cgi->end_html;

# And we're done with the database
$mysql->disconnect();

# Subroutine to print out the name of the current oncall person, giving it
# a color to match the group key
sub printChanges {
  my $change;
  my $date = $_[0];
  (my $year, my $month, my $day) = split(/-/, $date);
  print "        <div class='clear'></div>\n";
  foreach $change (@{$date}) {
    (my $hh, my $mm, my $ss) = (split(/:/, ${$change}[0]));
    $divId = "${$change}[2]\_${$change}[1]\_$day$month\_$hh$mm";
    print "        <div class='slot_wrapper' onmouseover='showEdit(\"$divId\")' outmouseout='hideEdit(\"$divId\")'>\n";
    print "          <div id='$divId' class='edit_day' style='visibility: hidden;'><a href='http://oncall.leanlogistics.com/cgi-bin/edit_day.pl?month=$month&day=$day&year=$year&group=${$change}[1]'><img height='20' width='20' src='http://oncall.leanlogistics.com/images/edit_day.jpg' alt='Edit Day'></a></div>\n";
    printf("          <div class='slot' onmouseover='showEdit(\"$divId\")' onmouseout='hideEdit(\"$divId\")'><p style='color: %s;'><strong>%02d:%02d - %s</strong></p></div>\n", $groupColors[${$change}[1]], $hh, $mm, ${$change}[2]);
    print "        </div>\n";
    print "        <div class='clear'></div>\n";
  }
}

sub groupMembers {
  my $gid = $_[0];
  my $gmqResult;
  my @members;
  $gmq = $mysql->prepare("SELECT id, username, firstname FROM victims WHERE groupid='$gid' and active='1'");
  $gmq->execute() or die DBI->errstr;
  while($gmqResult = $gmq->fetchrow_arrayref) {
    push(@members, $gmqResult->[2]);
  }
  $gmq->finish;
  return(@members);
}
