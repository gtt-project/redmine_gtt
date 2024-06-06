require_relative '../../../../test/application_system_test_case'
require_relative '../test_helper'

class IssuesMapTest < ApplicationSystemTestCase
  fixtures :projects, :users, :email_addresses, :roles, :members, :member_roles,
           :trackers, :projects_trackers, :enabled_modules, :issue_statuses, :issues,
           :enumerations, :custom_fields, :custom_values, :custom_fields_trackers,
           :watchers, :journals, :journal_details

  setup do
    User.current = nil
    @maplayer = RedmineGtt::Actions::CreateMapLayer.(
      name: 'OSM Tiles',
      layer: 'Tile',
      source: 'OSM',
      source_options_string: '{"url":"https://tile.openstreetmap.jp/{z}/{x}/{y}.png"}'
    ).map_layer
    @project = Project.find 'ecookbook'
    @project.enabled_modules.create name: 'gtt'
    @project.gtt_map_layers << @maplayer
  end

  teardown do

  end

  test 'should not show issues map in gtt disabled project' do
    log_user('jsmith', 'jsmith')
    visit '/issues/4'

    assert_no_selector('div.ol-map')
  end

  test 'should show alert box on issues map in no baselayer project' do
    @project.gtt_map_layers.clear
    log_user('jsmith', 'jsmith')
    visit '/issues/1'

    assert_selector('div.ol-map') do
      assert_no_selector('canvas')
      page.has_content?('There is no baselayer available!')
    end
  end

  test 'should show issues new map from global scope only when selected project enables gtt module' do
    log_user('jsmith', 'jsmith')
    visit '/issues/new'

    # Default gtt enabled project
    assert_selector('div.ol-map') do
      assert_selector('canvas')
    end

    # Select gtt disabled project
    page.find('#issue_project_id').select('OnlineStore')
    assert_no_selector('div.ol-map')

    # Select gtt enabled project again
    page.find('#issue_project_id').select('eCookbook')
    assert_selector('div.ol-map') do
      assert_selector('canvas')
    end
  end
end
