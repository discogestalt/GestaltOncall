#!/usr/bin/perl

use DBI;
use Date::Parse;
use Date::Calc qw(Add_Delta_Days Month_to_Text);
use CGI;

# Create new CGI object
$cgi = new CGI;

# Get the current date and save the parts to an array
my $now = localtime();
($nDay, $nMonth, $nYear) = (strptime($now))[3,4,5];
$nMonth += 1;
$nYear += 1900;
(@now) = ($nYear, $nMonth, $nDay);

# Create database connection object
$mysql = DBI->connect('DBI:mysql:oncall;host=io.leanlogistics.com','oncall','oncall') || die "Couldn't connect to database: $DBI::errstr";

# Check for the submit button - if that's been pressed we populate 
# the changes, otherwise we print the form
if($cgi->param('submit_edit')) {
  &populateChanges;
} else {
  &printForm;
}


$mysql->disconnect();

sub printForm {
  $cgi->url_param('month')?$editMonth=$cgi->url_param('month'):$editMonth=$cgi->param('month');
  $editMonth = $now[1] unless $editMonth;
  $cgi->url_param('year')?$editYear=$cgi->url_param('year'):$editYear=$cgi->param('year');
  $editYear = $now[0] unless $editYear;
  $cgi->url_param('day')?$editDay=$cgi->url_param('day'):$editDay=$cgi->param('day');
  $editDay = $now[2] unless $editDay;
  $cgi->url_param('group')?$editGroup=$cgi->url_param('group'):$editGroup=$cgi->param('group');
  &errorScreen unless $editGroup;

  $monthString = Month_to_Text($editMonth);
  ($prevYear,$prevMonth,$prevDay) = Add_Delta_Days($editYear,$editMonth,$editDay,-1);
  ($nextYear,$nextMonth,$nextDay) = Add_Delta_Days($editYear,$editMonth,$editDay,1);

  ($defaultTurnover, $groupName) = &getDefaultTurnover($editGroup);

  &getCurrent;
  
  print $cgi->header;
  print $cgi->start_html(-title=>"Editing $groupName rotation for $monthString $editDay, $editYear", -style=>[{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'}, {'src'=>'http://oncall.leanlogistics.com/css/edit.css'}]);
  print "  <div id='calendar_container'>\n";
  print $cgi->start_form(-action=>"/cgi-bin/edit_day.pl");
  print "    <table id='edit_day' cellspacing='0' cellpadding='5' border='0' style='border: 1px solid #999;'>\n";
  print "      <tr id='head'>\n";
  print "        <td colspan='2'>\n";
  print "          <span style='font-size: 12pt; font-weight: bold;'>$groupName On-Call: $monthString $editDay, $editYear</span>\n";
  print "        </td>\n";
  print "      </tr>\n";
  print "      <tr id='submit'>\n";
  if($cgi->referer()) {
    my $last = $cgi->referer();
    print "        <td><p><a href='$last'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a></p></td>\n";
    print $cgi->hidden(-name=>'from', -value=>$last);
  } else {
    print "        <td><p><a href='http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a></p></td>\n";
  }
  print "        <td style='text-align: right;'>\n";
  print $cgi->submit(-name=>'submit_edit', -label=>'Save Changes');
  print "        </td>\n";
  print "      </tr>\n";
  print "      <tr id='item_head'>\n";
  print "        <th style='border-right: 1px solid #999; border-bottom: 1px solid #999;'><span style='font-size: 10pt;'>Start Time</span></th>\n";
  print "        <th style='border-bottom: 1px solid #999;'><span style='font-size: 10pt'>Person</span></th>\n";
  print "      </tr>\n";
  $turnover = 0;
  $vNum = 0;
  @vColors = ('LightBlue','LightGreen','LightSalmon','DarkKhaki','CadetBlue','DarkSeaGreen','SandyBrown');
  $color = $vColors[$vNum];
  foreach $slot (@slots) {
    $csv = ${$slot}[2];
    if($psv) {
      unless($csv eq $psv) {
	$vNum++;
	$color = $vColors[$vNum];
      }
    }
    print "      <tr bgcolor='$color' style='border-bottom: 1px solid #999;'>\n";
    print "        <td style='text-align: center; padding: 3px; border-right: 1px solid #999; border-bottom: 1px solid #999;'>$slot</td>\n";
    print "        <td style='text-align: center; padding: 3px; border-bottom: 1px solid #999;'>\n";
    if(${$slot}[2]) {
      print $cgi->popup_menu(-name=>$slot,
                             -values=>[sort keys (%victimNames)],
			     -labels=>\%victimNames,
			     -default=>${$slot}[2]);
      $psv = ${$slot}[2];
    } else {
      print $cgi->popup_menu(-name=>$slot,
                             -values=>[sort keys (%victimNames)],
			     -labels=>\%victimNames);
    }
    print "        </td>\n";
    print "      </tr>\n";
  }
  print "    </table>\n";
  print "  </div>\n";
  print $cgi->hidden(-name=>'group', -value=>$editGroup);
  print $cgi->hidden(-name=>'day', -value=>$editDay);
  print $cgi->hidden(-name=>'month', -value=>$editMonth);
  print $cgi->hidden(-name=>'year', -value=>$editYear);
  print $cgi->end_html;

}

sub populateChanges {
#  @paramNames=$cgi->param;
  $editGroup = $cgi->param('group');
  (my $defaultTurnover, my $groupName) = &getDefaultTurnover($editGroup);
  $editDay = $cgi->param('day');
  $editMonth = $cgi->param('month');
  $editYear = $cgi->param('year');

  print $cgi->header;
  print $cgi->start_html(-title=>"On-Call calendar for group $groupName updated", -style=>{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'});
  print "  <div id='calendar_container'>\n";
  print $cgi->h1("On-Call Calendar for $groupName updated\n");
  print $cgi->p("The following changes were made:\n");
  print "    <ul>\n";

  &getCurrent;

  foreach $slot (@slots) {
    next if($cgi->param($slot) eq "--");
    next if($cgi->param($slot) eq ${$slot}[2]);
    $newVictim = $cgi->param($slot);
    $oldVictim = ${$slot}[2];
    $fullSlot = sprintf("%4d-%02d-%02d %s:%02d", $editYear,$editMonth,$editDay,$slot,$seconds);
    if(! $oldVictim) {
      $edq = $mysql->prepare("INSERT INTO calendar set slot='$fullSlot', victimid=(select id from victims where username='$newVictim'), groupid='$editGroup'");
    } else {
      $edq = $mysql->prepare("UPDATE calendar set victimid=(select id from victims where username='$newVictim') where slot='$fullSlot' and groupid='$editGroup'");
    }
    $edq->execute() or die DBI->errstr;
    $edq->finish();
    if(! $oldVictim) {
      print "<li>$slot: Set on-call to $newVictim</li>\n";
    } else {
      print "<li>$slot: $oldVictim switched to $newVictim</li>\n";
    }
  }
  print "    </ul>\n";
  if($cgi->param('from')) {
    my $last = $cgi->param('from');
    print $cgi->a({-href=>$last},"Return to On-Call Calendar");
  } else {
    print $cgi->a({-href=>"http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl"},"Return to On-Call Calendar");
  }
  print $cgi->end_html;
}

sub getCurrent {
  $searchString = sprintf("%4d-%02d-%02d", $editYear,$editMonth,$editDay);
  $dayq = $mysql->prepare("SELECT c.slot,c.groupid,c.victimid,v.username FROM calendar c, victims v WHERE c.slot like '$searchString \%' and c.groupid='$editGroup' and v.id=c.victimid order by slot");
  $dayq->execute() or die DBI->errstr;
  while($dayqResult = $dayq->fetchrow_arrayref) {
    (my $day, my $slot) = split(/ /, $dayqResult->[0]);
    push(@slots, $slot);
    my $groupid = $dayqResult->[1];
    my $victimid = $dayqResult->[2];
    my $victim = $dayqResult->[3];
    @{$slot} = ($groupid, $victimid, $victim);
  }
  $dayq->finish();

  $victimNames{"--"} = "----";
  $vlq = $mysql->prepare("SELECT id, username, firstname, lastname FROM victims WHERE groupid='$editGroup' and active='1'");
  $vlq->execute() or die DBI->errstr;
  while($vlqResult = $vlq->fetchrow_arrayref) {
    $victimNames{$vlqResult->[1]} = "$vlqResult->[2] $vlqResult->[3]";
    $victimIDs{$vlqResult->[1]} = $vlqResult->[0];
  }
  $vlq->finish();
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

