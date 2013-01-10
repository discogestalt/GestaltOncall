#!/usr/bin/perl

use DBI;
use CGI;

# Create new CGI object
$cgi = new CGI;

# Create database connection object
$mysql = DBI->connect('DBI:mysql:oncall;host=io.leanlogistics.com','oncall','oncall') || die "Couldn't connect to database: $DBI::errstr";

# Check for the submit button - if that's been pressed we populate 
# the changes, otherwise we print the form
if($cgi->param('update_group')) {
  &populateChanges;
} elsif($cgi->param('add_victim')) {
  &addUser;
} elsif($cgi->param('update_user')) {
  &updateUser;
} elsif($cgi->param('delete_user')) {
  &deleteUser;
} else {
  &printForm;
}

$mysql->disconnect();

sub printForm {
  my $message = $_[0];
  my $pGroup = $_[1];
  my $passedLast = $_[2];
  $cgi->url_param('group')?$editGroup=$cgi->url_param('group'):$editGroup=$cgi->param('group');
  unless($editGroup) {
    $editGroup = $pGroup;
  }

  &getGroupInfo;

  print $cgi->header;
  print $cgi->start_html(-title=>"Editing Group Information for: $groupInfo{name}", -style=>[{'src'=>'http://oncall.leanlogistics.com/css/calendar.css'}, {'src'=>'http://oncall.leanlogistics.com/css/edit.css'}]);
  print <<JS;
    <script language="javascript">
      function toggle(toggleDiv) {
	var tdiv = document.getElementById(toggleDiv);
	if(tdiv.style.display == 'block') {
	  tdiv.style.display = 'none';
	} else {
	  tdiv.style.display = 'block';
	}
      }
    </script>
JS

  if($message) {
    print "  <div id='message'>\n";
    print "    <h2>$message</h2>\n";
    print "  </div>\n";
  }
  if( $passedLast ) {
    $last = $passedLast;
  } elsif($cgi->param('from')) {
    $last = $cgi->param('from');
    print "<!-- Found the from parameter -->\n";
  } elsif($cgi->referer()) {
    $last = $cgi->referer();
    print "<!-- Using the referer -->\n";
  }
  print "  <div id='edit_container'>\n";
  print "    <div id='edit_group_head'>\n";
  print "      <h2>Editing Group: $groupInfo{name}</h2>\n";
  print "    </div>\n";
  print "    <div id='edit_group_info'>\n";
  print $cgi->start_form(-action=>"/cgi-bin/edit_group.pl");
  print "      <div id='rotation_time_label' class='edit_label'>\n";
  print "        <p><strong>Default rotation time:</strong></p>\n";
  print "      </div>\n";
  print "      <div id='rotation_time_input' class='edit_input'>\n";
  print $cgi->textfield(-name=>'rotation_time',
                        -size=>8,
			-value=>$groupInfo{slot});
  print "      </div>\n";
  print "      <div id='autorotate_label' class='edit_label'>\n";
  print "        <p><strong>Auto Rotate Zenoss paging? </strong></p>\n";
  print "      </div>\n";
  print "      <div id='autorotate_input' class='edit_input'>\n";
  print $cgi->radio_group(-name=>'autorotate',
                          -values=>['1','0'],
			  -labels=>{'1'=>'Yes','0'=>'No'},
			  -default=>$groupInfo{auto},
			  -onclick=>"toggle(\"group_aliases\")");
  print "      </div>\n";
  print "      <div class='clear'></div>\n";
  print "      <div id='email_label' class='edit_label'>\n";
  print "        <p><strong>Group contact email: </strong></p>\n";
  print "      </div>\n";
  print "      <div id='email_input' class='edit_input'>\n";
  print $cgi->textfield(-name=>'email',
                        -size=>'80',
			-value=>$groupInfo{email});
  print "      </div>\n";
  print "      <div class='clear'></div>\n";
  if($groupInfo{auto} > 0) {
    print "      <div id='group_aliases' style='display: block;'>\n";
  } else {
    print "      <div id='group_aliases' style='display: none;'>\n";
  }
  print "        <div id='alias_label' class='edit_label'>\n";
  print "          <p><strong>Pager alias for the on-call: </strong></p>\n";
  print "        </div>\n";
  print "        <div id='alias_input' class='edit_input'>\n";
  print $cgi->textfield(-name=>'alias',
                        -size=>'20',
			-value=>$groupInfo{alias});
  print "\@oncall.leanlogistics.com\n";
  print "        </div>\n";
  print "        <div class='clear'></div>\n";
  print "        <div id='backup_label' class='edit_label'>\n";
  print "          <p><strong>Set a backup alias for the on-call? </strong></p>\n";
  print "        </div>\n";
  print "        <div id='backup_input' class='edit_input'>\n";
  print $cgi->radio_group(-name=>'backup',
                          -values=>['1','0'],
			  -labels=>{'1'=>'Yes','0'=>'No'},
			  -default=>$groupInfo{backup});
  print $cgi->textfield(-name=>'bualias',
                        -size=>'20',
			-value=>$groupInfo{bualias});
  print "\@oncall.leanlogistics.com\n";
  print "        </div>\n";
  print "        <div class='clear'></div>\n";
  print "        <div id='failsafe_label' class='edit_label'>\n";
  print "          <p><strong>Set a failsafe alias for the on-call? </strong></p>\n";
  print "        </div>\n";
  print "        <div id='failsafe_input' class='edit_input'>\n";
  print $cgi->radio_group(-name=>'failsafe',
                          -values=>['1','0'],
			  -labels=>{'1'=>'Yes','0'=>'No'},
			  -default=>$groupInfo{failsafe});
  print $cgi->textfield(-name=>'fsalias',
                        -size=>'20',
			-value=>$groupInfo{fsalias});
  print "\@oncall.leanlogistics.com\n";
  print "        </div>\n";
  print "        <div class='clear'></div>\n";
  print "      </div>\n";
  print "      <div id='edit_group_submit'>\n";
  print $cgi->submit(-name=>'update_group', -label=>'Update Group Info');
  print "      </div>\n";
  if($last) {
    print $cgi->hidden(-name=>'from', -value=>$last);
  }
  print $cgi->hidden(-name=>'group', -value=>$editGroup);
  print $cgi->end_form;
  print "    </div>\n";
  print "    <div id='edit_victim_info'>\n";
  print "      <div id='victims_head'>\n";
  print "        <h2>Rotation Group Members:</h2>\n";
  print "      </div>\n";
  print "      <div id='victims_list'>\n";
  print "        <table id='victims_table' cellspacing='0' cellpadding='0' broder='1'>\n";
  print "          <tr style='background-color: #eee;'>\n";
  print "            <th>Username</th>\n";
  print "            <th>First Name</th>\n";
  print "            <th>Last Name</th>\n";
  print "            <th>Cell Phone</th>\n";
  print "            <th>Active in Rotation?</th>\n";
  print "            <td>&nbsp;</td>\n";
  print "            <td>&nbsp;</td>\n";
  print "          </tr>\n";
  foreach $v (@victims) {
    if($even) {
      print "          <tr style='background-color: #eee;'>\n";
    } else {
      print "          <tr>\n";
    }
    print $cgi->start_form(-action=>'/cgi-bin/edit_group.pl');
    print "            <td>";
    print $cgi->hidden(-name=>'v_id', -value=>${$v}{id});
    print $cgi->textfield(-name=>'v_username', -size=>'10', -value=>$v);
    print "</td>\n";
    print "            <td>";
    print $cgi->textfield(-name=>'v_first', -size=>'10', -value=>${$v}{firstname});
    print "</td>\n";
    print "            <td>";
    print $cgi->textfield(-name=>'v_last', -size=>'15', -value=>${$v}{lastname});
    print "</td>\n";
    print "            <td>";
    print $cgi->textfield(-name=>'v_phone', -size=>'12', -value=>${$v}{phone});
    print "</td>\n";
    print "            <td>";
    print $cgi->radio_group(-name=>'v_active',
                            -values=>['1','0'],
			    -labels=>{'1'=>'Yes','0'=>'No'},
			    -default=>(${$v}{active}?'1':'0'));
    print "</td>\n";
    print "            <td>";
    print $cgi->submit(-name=>'update_user', -label=>'Update User');
    print "</td>\n";
    print "            <td>";
    print $cgi->submit(-name=>'delete_user', -label=>'Delete User');
    print "</td>\n";
    print $cgi->hidden(-name=>'group', -value=>$editGroup);
    if($last) {
      print $cgi->hidden(-name=>'from', -value=>$last);
    }
    print $cgi->end_form;
    print "          </tr>\n";
    if($even) {
      $even = 0;
    } else {
      $even = 1;
    }
  }
  print "          <tr>\n";
  print $cgi->start_form(-action=>'/cgi-bin/edit_group.pl');
  print "            <td>";
  print $cgi->textfield(-name=>'new_username',
                        -size=>'10');
  print "</td>\n";
  print "            <td>";
  print $cgi->textfield(-name=>'new_firstname',
                        -size=>'10');
  print "</td>\n";
  print "            <td>";
  print $cgi->textfield(-name=>'new_lastname',
                        -size=>'15');
  print "</td>\n";
  print "            <td>";
  print $cgi->textfield(-name=>'new_phone',
                        -size=>'12');
  print "</td>\n";
  print "            <td>";
  print $cgi->checkbox_group(-name=>'new_active',
                             -values=>['Yes']);
  print "</td>\n";
  print "            <td>";
  print $cgi->submit(-name=>'add_victim',
                     -label=>'Add User');
  print "</td>\n";
  print "            <td></td>\n";
  print "          </tr>\n";
  print $cgi->hidden(-name=>'group', -value=>$editGroup);
  print "          </tr>\n";
  print "          <tr id='back_link'>\n";
  print "            <td colspan='7'>\n";
  if($last) {
    print "              <a href='$last'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a>\n";
    print $cgi->hidden(-name=>'from', -value=>$last);
  } else {
    print "              <a href='http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl'><img src=http://oncall.leanlogistics.com/images/left_arrow.png height='30' width='30'>Return to Calendar</a>\n";
  }
  print "            </td>\n";
  print "          </tr>\n";
  print $cgi->end_form;
  print "        </table>\n";
  print "      </div>\n";
  print "    </div>\n";
  print "  </div>\n";
  print $cgi->end_html;
}

sub getGroupInfo {
  my $gq = $mysql->prepare("SELECT * FROM groups WHERE id='$editGroup'");
  $gq->execute or die DBI->errstr;
  my $gqResult = $gq->fetchrow_arrayref();
  %groupInfo = ('id'=>$gqResult->[0],
                'name'=>$gqResult->[1],
		'active'=>$gqResult->[2],
		'slot'=>$gqResult->[3],
		'oncallid'=>$qgResult[4],
		'backupid'=>$gqResult[5],
		'auto'=>$gqResult->[6],
		'backup'=>$gqResult->[7],
		'failsafe'=>$gqResult->[8],
		'alias'=>$gqResult->[9],
		'bualias'=>$gqResult->[10],
		'fsalias'=>$gqResult->[11],
		'email'=>$gqResult->[12],);
  $gq->finish;
  my $vq = $mysql->prepare("SELECT * FROM victims WHERE groupid='$editGroup'");
  $vq->execute or die DBI->errstr;
  while(my $vqResult = $vq->fetchrow_arrayref()) {
    push(@victims, $vqResult->[2]);
    ${$vqResult->[2]}{id} = $vqResult->[0];
    ${$vqResult->[2]}{firstname} = $vqResult->[3];
    ${$vqResult->[2]}{lastname} = $vqResult->[4];
    ${$vqResult->[2]}{phone} = $vqResult->[5];
    ${$vqResult->[2]}{active} = $vqResult->[6];
  }
  $vq->finish;
}

sub populateChanges {
  $editGroup = $cgi->param('group');
  $newRotSlot = $cgi->param('rotation_time');
  $newAuto = $cgi->param('autorotate');
  $newEmail = $cgi->param('email');
  $newAlias = $cgi->param('alias');
  $newBU = $cgi->param('backup');
  $newBUalias = $cgi->param('bualias');
  $newFS = $cgi->param('failsafe');
  $newFSalias = $cgi->param('fsalias');
  if( $cgi->param('from') ) {
    $last = $cgi->param('from');
  } else {
    $last = "http://oncall.leanlogistics.com/cgi-bin/oncall_calendar.pl";
  }

  my $gu = $mysql->prepare("UPDATE groups SET turnover_slot='$newRotSlot', autorotate='$newAuto', email='$newEmail', alias='$newAlias', backup='$newBU', failsafe='$newFS', backup_alias='$newBUalias', failsafe_alias='$newFSalias' WHERE id='$editGroup'");
  $gu->execute() or die DBI->errstr;
  $gu->finish;

  $cgi->delete_all();
  &printForm("Successfully updated group info", $editGroup, $last);
}

sub updateUser {
  my $editGroup = $cgi->param('group');
  my $vId = $cgi->param('v_id');
  my $vUsername = $cgi->param('v_username');
  my $vFirst = $cgi->param('v_first');
  my $vLast = $cgi->param('v_last');
  my $vPhone = $cgi->param('v_phone');
  my $vActive = $cgi->param('v_active');

  my $vu = $mysql->prepare("UPDATE victims SET username='$vUsername', firstname='$vFirst', lastname='$vLast', phone='$vPhone', active='$vActive' WHERE id='$vId'");
  $vu->execute() or die DBI->errstr;
  $vu->finish;

  $cgi->delete_all();
  &printForm("Successfully updated user $vUsername", $editGroup);
}

sub addUser {
  my $editGroup;
  my $vUsername;
  my $vFirst;
  my $vLast;
  my $vPhone;
  my $vActive;

  unless($editGroup = $cgi->param('group')) {
    &printForm("No group id found in submit");
    return;
  }
  unless($vUsername = $cgi->param('new_username')) {
    &printForm("No username given, please correct and submit new user again");
    return;
  }
  unless($vFirst = $cgi->param('new_firstname')) {
    &printForm("No first name given, please correct and submit new user again");
    return;
  }
  unless($vLast = $cgi->param('new_lastname')) {
    &printForm("No last name given, please correct and submit new user again");
    return;
  }
  unless($vPhone = $cgi->param('new_phone')) {
    &printForm("No phone number given, please correct and submit new user again");
    return;
  }
  unless($vPhone =~ /[0-9]{10}/) {
    &printForm("Phone number must be entered as 10 digits, with no special characters (e.g. 6161234567)<br>You entered: $vPhone");
    return;
  }
  if($cgi->param('new_active')) {
    $vActive='1';
  } else {
    $vActive='0';
  }

  my $av = $mysql->prepare("INSERT INTO victims SET groupid='$editGroup', username='$vUsername', firstname='$vFirst', lastname='$vLast', phone='$vPhone', active='$vActive'");
  $av->execute() or die DBI->errstr;
  $av->finish;

  $cgi->delete_all();
  &printForm("Successfully added user $vUsername", $editGroup);
}

sub deleteUser {
  my $editGroup = $cgi->param('group');
  my $vUsername = $cgi->param('v_username');
  my $vId = $cgi->param('v_id');

  my $dv = $mysql->prepare("DELETE FROM victims WHERE id='$vId'");
  $dv->execute() or die DBI->errstr;
  $dv->finish;

  $cgi->delete_all();
  &printForm("Successfully deleted user $vUsername", $editGroup);
}
