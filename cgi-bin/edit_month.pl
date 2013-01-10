#!/usr/bin/perl

use DBI;
use Date::Parse;
use Date::Calc qw(Days_in_Month Month_to_Text Week_of_Year Day_of_Week Add_Delta_Days Add_Delta_DHMS);
use CGI;

# Create new CGI object
$cgi = new CGI;

# Get the current date and save the parts to an array
my $now = localtime();
($nDay, $nMonth, $nYear) = (strptime($now))[3,4,5];
$nMonth += 1;
$nYear += 1900;
(@now) = ($nYear, $nMonth, $nDay);

# create database connection object
$mysql = DBI->connect('DBI:mysql:oncall;host=io.leanlogistics.com','oncall','oncall') || die "Couldn't connect to database: $DBI::errstr";

# Check for the submit button - if that's been pressed we populate 
# the changes, otherwise we print the form
if($cgi->param('submit_month')) {
  &populateChanges;
} else {
  &printForm;
}

$mysql->disconnect();

sub printForm {
# Check to see if we're called with a month and/or year, otherwise
# # default to the current month and year
  if(($cgi->url_param('month')) || ($cgi->param('month'))) {
    $cgi->url_param('month')?$displayMonth = $cgi->url_param('month'):$displayMonth =$cgi->param('month');
  } else {
    $displayMonth = $now[1];
  }
  if(($cgi->url_param('year')) || ($cgi->param('year'))) {
    $cgi->url_param('year')?$displayYear = $cgi->url_param('year'):$displayYear = $cgi->param('year');
  } else {
    $displayYear = $now[0];
  }
# We also need to know which group's rotation we're editing
  $cgi->url_param('group')?$editGroup = $cgi->url_param('group'):$editGroup = $cgi->param('group');
  &errorPage unless($editGroup);

# How many days are there in this month?
  $displayDays = Days_in_Month($displayYear, $displayMonth);
# What day of the week does the first of the month fall on?
  $firstDay = Day_of_Week($displayYear,$displayMonth,1);
# What day of the week does the last of the month fall on?
  $lastDay = Day_of_Week($displayYear,$displayMonth,$displayDays);

# The month, in text
  $monthString = Month_to_Text($displayMonth);

  ($defaultTurnover, $groupName) = &getDefaultTurnover($editGroup);

# If the first day of the month is a Sunday we're good to go, otherwise
# we need to get some days from the previous month to fill in
  if($firstDay == 7) {
# If this is January, last month is December, and the year is different too
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
# And set up the search string to pull the turnover entries from that day
    $preSearch = sprintf("'%4d-%02d-%02d %s'", $preYear,$preMonth,$preStartDay[2],$defaultTurnover);
# Save it in a string too, we'll need it later
    $dayString = sprintf("%4d-%02d-%02d", $preYear,$preMonth,$preStartDay[2]);
# In fact, save that string in an array
    push(@days, $dayString);
# This day isn't in the current display month, make note of it
    $outDays{$dayString} = 1;
# Now we loop through and do the same with the rest of the days we need
    for($pd = ($preStartDay[2] + 1); $pd <= $preMonthLength; $pd++) {
      $preSearch .= sprintf(" or c.slot='%4d-%02d-%02d %s'", $preYear,$preMonth,$pd,$defaultTurnover);
      $dayString = sprintf("%4d-%02d-%02d", $preYear,$preMonth,$pd);
      push(@days, $dayString);
      $outDays{$dayString} = 1;
    }
# Create a query object for the previous month data
    $preq = $mysql->prepare("SELECT c.slot, c.groupid, v.username from calendar c, victims v where c.groupid='$editGroup' and (c.slot=$preSearch) and v.id=c.victimid order by c.slot");
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
# No looping here since we're only pulling one slot per day
      push(@{$day}, $slot, $group, $victim);
    }
# Close out the query object
    $preq->finish();
  }

# Now push all the days for the displayed month into that master array
  for($cmd = 1; $cmd <= $displayDays; $cmd++) {
    push(@days, sprintf("%4d-%02d-%02d", $displayYear, $displayMonth, $cmd));
  }

# Create a query object for the displayed month's data. See above
# for what we're going to do with it
# String to match the year and month in the database
  $searchString = sprintf("%4d-%02d-%% %s", $displayYear, $displayMonth, $defaultTurnover);
  $vq = $mysql->prepare("SELECT c.slot, c.groupid, v.username from calendar c, victims v where c.groupid='$editGroup' and c.slot like '$searchString' and v.id=c.victimid order by c.slot");
  $vq->execute() or die DBI->errstr;
  while($vResult = $vq->fetchrow_arrayref) {
    (my $day, my $slot) = split(/ /, $vResult->[0]);
    my $group = $vResult->[1];
    my $victim = $vResult->[2];
    push(@{$day}, $slot, $group, $victim);
  }
  $vq->finish();

# If the last day of the displayed month isn't a Saturday we need to fill
# in the end of the week with data from the following month
  unless( $lastDay == 6 ) {
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
    $postSearch = sprintf("'%4d-%02d-%02d %s'", $postYear,$postMonth,1,$defaultTurnover);
    $dayString = sprintf("%4d-%02d-%02d", $postYear,$postMonth,1);
    push(@days, $dayString);
    $outDays{$dayString} = 1;
    for($ad = 2; $ad <= $postDays; $ad++) {
      $postSearch .= sprintf(" or c.slot like '%4d-%02d-%02d %s'", $postYear,$postMonth,$ad,$defaultTurnover);
      $dayString = sprintf("%4d-%02d-%02d", $postYear,$postMonth,$ad);
      push(@days, $dayString);
      $outDays{$dayString} = 1;
    }
    $postq = $mysql->prepare("SELECT c.slot, c.groupid, v.username from calendar c, victims v where c.groupid='$editGroup' and (c.slot like $postSearch) and v.id=c.victimid order by c.slot");
    $postq->execute() or die DBI->errstr;
    while($postResult = $postq->fetchrow_arrayref) {
      (my $day, my $slot) = split(/ /, $postResult->[0]);
      my $group = $postResult->[1];
      my $victim = $postResult->[2];
      push(@{$day}, $slot, $group, $victim);
    }
    $postq->finish();
  }

  $victimNames{"--"} = "----";
  $vlq = $mysql->prepare("SELECT id, username, firstname, lastname FROM victims WHERE groupid='$editGroup' and active='1'");
  $vlq->execute() or die DBI->errstr;
  while($vlqResult = $vlq->fetchrow_arrayref) {
    $victimNames{$vlqResult->[1]} = "$vlqResult->[2] $vlqResult->[3]";
    $victimIDs{$vlqResult->[1]} = $vlqResult->[0];
  }
  $vlq->finish();

  print $cgi->header;
  print $cgi->start_html(-title=>"Editing $groupName rotation for $monthString $displayYear", -style=>[{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'}, {'src'=>'http://oncall.leanlogistics.com/css/edit.css'}]);
  print "  <div id='calendar_container'>\n";
  print $cgi->start_form(-action=>"/cgi-bin/edit_month.pl");
  print "    <table id='calendar' cellspacing='0' width='100%' border='0'>\n";
  print "      <tr id='head'>\n";
  if($cgi->referer()) {
    my $last = $cgi->referer();
    print "        <td><p><a href='$last'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a></p></td>\n";
    print $cgi->hidden(-name=>'from', -value=>$last);
  } else {
    print "        <td><p><a href='http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a></p></td>\n";
  }
  print "        <td colspan='5'>\n";
  print "          <h1>$groupName oncall - $monthString $displayYear</h1>\n";
  print "        </td>\n";
  print "        <td id='submit'>\n";
  print $cgi->submit(-name=>'submit_month', -label=>'Save Changes');
  print "        </td>\n";
  print "      <tr id='weekday_head'>\n";
  print "        <th id='Sunday' class='dayname'><h4>Sunday</h4></th>\n";
  print "        <th id='Monday' class='dayname_left'><h4>Monday</h4></th>\n";
  print "        <th id='Tuesday' class='dayname'><h4>Tuesday</h4></th>\n";
  print "        <th id='Wednesday' class='dayname'><h4>Wednesday</h4></th>\n";
  print "        <th id='Thursday' class='dayname'><h4>Thursday</h4></th>\n";
  print "        <th id='Friday' class='dayname'><h4>Friday</h4></th>\n";
  print "        <th id='Saturday' class='dayname'><h4>Saturday</h4></th>\n";
  print "      </tr>\n";

  foreach $date (@days) {
    (my $yy, my $mm, my $dd) = (split(/-/, $date));
    my $todayIs = Day_of_Week($yy,$mm,$dd);
    ($week, $year) = Week_of_Year($yy,$mm,$dd);
    if($todayIs == 7) {
      if(($mm == 1) && ($week == 52)) {
	$week = 1;
      } else {
	$week += 1;
      }
    }
    my $class;
    if($outDays{$date}) {
      $class = "grey_day";
    } else {
      $class = "day";
    }
# If it's a weekend (and not the current day) higlight it green,
# if it is today, highlight it blue
    if($mm == $now[1]) {
      if($dd == $now[2]) {
	$class .= " today";
      } elsif($todayIs > 5) {
	$class .= " weekend";
      }
    } elsif(($todayIs > 5) && (! $outDays{$date})) {
      $class .= " weekend";
    }

    if($workingWeek == $week) {
      print "        <td class='$class'>\n";
      print "          <a href='http://oncall.leanlogistics.com/cgi-bin/edit_day.pl?month=$mm&day=$dd&year=$yy&group=$editGroup'>";
      printf("<h4>%02d</h4>", $dd);
      print "</a>\n";
      &printVList($date);
      print "        </td>\n";
    } else {
      if($workingWeek) {
	print "      </tr>\n";
      }
      print "      <tr id='$week' class='week'>\n";
      print "        <td class='$class day_left'>\n";
      print "          <a href='http://oncall.leanlogistics.com/cgi-bin/edit_day.pl?month=$mm&day=$dd&year=$yy&group=$editGroup'>";
      printf("<h4>%02d</h4>", $dd);
      print "</a>\n";
      &printVList($date);
      print "        </td>\n";
      $workingWeek = $week;
    }
  }
  print "      </tr>\n";
  print "    </table>\n";
  print $cgi->hidden(-name=>'group', -value=>$editGroup);
  print $cgi->hidden(-name=>'calDate', -value=>"$displayMonth.$displayYear");
  print $cgi->end_form;
  print "  </div>\n";
  print "  <div id='notes'>\n";
  print "    <div id='notes_head'>\n";
  print "      <h4>Notes</h4>\n";
  print "    </div>\n";
  print "    <div id='notes_body'>\n";
  print "      <div class='note'>\n";
  print "        <p><strong>Warning:</strong></p>\n";
  print "        <p>The monthly editing interface will set your oncall person in full-day\n";
  print "        increments only. If you have already scheduled multiple people to be oncall\n";
  print "        during a single day during the period shown here, saving changes here <strong>will</strong>\n";
  print "        overwrite the previous schedule. If that's not what you want, use the daily edit\n";
  print "        interface to make your changes (click on the date for any day shown to switch to the daily edit mode for that date).\n";
  print "      </div>\n";
  print "      <div class='note'>\n";
  print "        <p><strong>Default Rotation Time:</strong> $defaultTurnover</p>\n";
  print "        <p>The oncall will change automatically at the default rotation time\n";
  print "        for each day. For example, if User A is oncall on the 1st and you set\n";
  print "        User B to take over on the 2nd, User A's oncall will extend on the 2nd\n";
  print "        until the default transition time.</p>\n";
  print "      </div>\n";
  print "    </div>\n";
  print "  </div>\n";
  print $cgi->end_html;
}

sub getDefaultTurnover {
  my $editGroup = $_[0];
  my $gq = $mysql->prepare("SELECT id, name, turnover_slot FROM groups WHERE id='$editGroup'");
  $gq->execute or die DBI->errstr;
  my $gqResult = $gq->fetchrow_arrayref();
  my $defaultTurnover = $gqResult->[2];
  my $groupName = $gqResult->[1];
  $gq->finish();
  return($defaultTurnover, $groupName);
}

sub printVList {
  my $entry;
  my $date = $_[0];
  if(${$date}[2]) {
    print $cgi->popup_menu(-name=>$date,
			   -values=>[sort keys (%victimNames)],
			   -labels=>\%victimNames,
			   -default=>${$date}[2]);
  } else {
    print $cgi->popup_menu(-name=>$date,
			   -values=>[sort keys (%victimNames)],
			   -labels=>\%victimNames);
  }
}

sub errorPage {
  print "Error page here\n";
}

sub populateChanges {
  @param_names = $cgi->param;
  my $group = $cgi->param('group');
  (my $defaultTurnover, my $groupName) = &getDefaultTurnover($group);
  ($sHour,$sMin,$sSeconds) = split(/:/, $defaultTurnover);
  print $cgi->header;
  print $cgi->start_html(-title=>"On-Call Calendar for group $groupName updated", -style=>{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'});
  print "  <div id='calendar_container'>\n";
  print $cgi->h1("On-Call Calendar for $groupName updated\n");
  print $cgi->p('The following updates were made:');
  print "<ul>\n";
  foreach $param_name (@param_names) {
    my $changes = 0;
    next if(($param_name eq "submit_month") || ($param_name eq "group") || ($param_name eq "calDate") || ($param_name eq "from"));
    $newVictim = $cgi->param($param_name);
    next if($newVictim eq "--");
#    (my $prevVictim, my $prevVictimId) = &checkCurrentVictim($param_name,$group,$defaultTurnover);
    %prevVictims = (&checkCurrentVictim($param_name, $group, $defaultTurnover));
    ($sYear,$sMonth,$sDay) = split(/-/, $param_name);
    for($m = 0; $m < 1440; $m += 30) {
      ($year,$month,$day,$hour,$min,$seconds) = Add_Delta_DHMS($sYear,$sMonth,$sDay,$sHour,$sMin,$sSeconds,0,0,$m,0);
      my $slot = sprintf("%4d-%02d-%02d %02d:%02d:%02d", $year,$month,$day,$hour,$min,$seconds);
      if(! $prevVictims{$slot}{victim}) {
	$pcq = $mysql->prepare("INSERT INTO calendar set slot='$slot', victimid=(SELECT id FROM victims WHERE username='$newVictim'), groupid='$group'");
	$changes++;
      } else {
	next if($prevVictims{$slot}{victim} eq $newVictim);
	$pcq = $mysql->prepare("UPDATE calendar set victimid=(SELECT id FROM victims WHERE username='$newVictim') where slot='$slot' and groupid='$group'");
	$changes++;
      }
      $pcq->execute() or die DBI->errstr;
      $pcq->finish();
    }
    if($changes) {
      print "<li>Date: $param_name - Set on-call to $newVictim</li>\n";
    } 
  }
  print "</ul>\n";
  ($calMonth, $calYear) = split(/\./, $cgi->param(calDate));
  if($cgi->param('from')) {
    my $last = $cgi->param('from');
    print $cgi->a({-href=>$last},"Return to Calendar");
  } else {
    print $cgi->a({-href=>"http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl?month=$calMonth&year=$calYear"},"Return to On-Call calendar");
  }
  print "  </div>\n";
  print $cgi->end_html;
}

sub checkCurrentVictim {
  (my $date, my $group, my $turnover) = @_;
#  my $cvq = $mysql->prepare("SELECT v.username, c.victimid FROM victims v, calendar c where c.slot='$date $turnover' and c.groupid='$group' and v.id=c.victimid");
  (my $ty, my $tm, my $td) = (split(/-/, $date));
  my $tomorrow = sprintf("%04d-%02d-%02d", Add_Delta_Days($ty,$tm,$td,1));
  my @dates = ($date, $tomorrow);
  my %victims;
  foreach $day (@dates) {
    my $cvq = $mysql->prepare("SELECT c.slot, v.username, c.victimid FROM victims v, calendar c WHERE c.slot like '$day%' and c.groupid='$group' and v.id=c.victimid");
    $cvq->execute() or die DBI->errstr;
    while( my $cvqResult = $cvq->fetchrow_arrayref) {
      my $slot = $cvqResult->[0];
      my $victim = $cvqResult->[1];
      my $victimid = $cvqResult->[2];
      $victims{$slot}{victim} = $victim;
    }
  }
  return(%victims);
}
