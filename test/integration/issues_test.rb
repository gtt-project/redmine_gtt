require_relative '../test_helper'

class IssuesTest < Redmine::IntegrationTest
  include GttTestData

  fixtures :projects,
           :users, :email_addresses,
           :roles,
           :members,
           :member_roles,
           :trackers,
           :projects_trackers,
           :enabled_modules,
           :issue_statuses,
           :issues,
           :enumerations,
           :custom_fields,
           :custom_values,
           :custom_fields_trackers, :custom_fields_projects,
           :attachments,
           :issue_categories

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

  test 'should create issue from global scope' do
    log_user('jsmith', 'jsmith')

    get '/issues/new'
    assert_response :success

    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Point',
        'coordinates' => [123.269691,9.305099,0.0]
      }
    }

    issue = new_record(Issue) do
      post(
        '/issues',
        :params => {
          :issue => {
            :project_id => "1",
            :tracker_id => "1",
            :start_date => "2006-12-26",
            :priority_id => "4",
            :subject => "new test issue with geometry from globa scope",
            :category_id => "",
            :description => "new issue",
            :done_ratio => "0",
            :due_date => "",
            :assigned_to_id => "",
            :custom_field_values => {'2' => 'Value for field 2'},
            :geojson => geo.to_json
          }
        }
      )
    end
    # check redirection
    assert_redirected_to :controller => 'issues', :action => 'show', :id => issue
    follow_redirect!

    # check issue geometry
    assert_equal geo['geometry'].to_json, issue.geom.to_json
  end

  test 'should create issue from project scope' do
    log_user('jsmith', 'jsmith')

    get '/projects/ecookbook/issues/new'
    assert_response :success

    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Point',
        'coordinates' => [123.269691,9.305099,0.0]
      }
    }

    issue = new_record(Issue) do
      post(
        '/projects/ecookbook/issues',
        :params => {
          :issue => {
            :tracker_id => "1",
            :start_date => "2006-12-26",
            :priority_id => "4",
            :subject => "new test issue with geometry from project scope",
            :category_id => "",
            :description => "new issue",
            :done_ratio => "0",
            :due_date => "",
            :assigned_to_id => "",
            :custom_field_values => {'2' => 'Value for field 2'},
            :geojson => geo.to_json
          }
        }
      )
    end
    # check redirection
    assert_redirected_to :controller => 'issues', :action => 'show', :id => issue
    follow_redirect!

    # check issue geometry
    assert_equal geo['geometry'].to_json, issue.geom.to_json
  end

  # Regression test: the geometry is rendered into the PDF as a fake custom
  # field. Redmine 6.1 started calling CustomField#thousands_delimiter? when
  # the formatted value is not a String, which made this request fail with a
  # 500 for issues with geometry.
  test 'should export issue with geometry as pdf' do
    log_user('jsmith', 'jsmith')

    issue = Issue.find(1)
    issue.geojson = point_geojson([135.0, 35.0, 0.0])
    issue.save!

    get "/issues/#{issue.id}.pdf"
    assert_response :success
    assert_equal 'application/pdf', response.media_type
  end
end
