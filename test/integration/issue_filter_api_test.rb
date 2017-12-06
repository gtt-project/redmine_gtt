require_relative '../test_helper'

class IssueFilterApiTest < Redmine::ApiTest::Base
  fixtures :projects,
    :users,
    :roles,
    :members,
    :member_roles,
    :issues,
    :issue_statuses,
    :issue_relations,
    :versions,
    :trackers,
    :projects_trackers,
    :issue_categories,
    :enabled_modules,
    :enumerations,
    :attachments,
    :workflows,
    :custom_fields,
    :custom_values,
    :custom_fields_projects,
    :custom_fields_trackers,
    :time_entries,
    :journals,
    :journal_details,
    :queries,
    :attachments

  setup do
    @project = Project.find 'ecookbook'
    @project.enabled_modules.create name: 'gtt'
  end

  POINT_OUT = {
    'type' => 'Feature',
    'geometry' => {
      'type' => 'Point',
      'coordinates' => [123.324966,9.425016]
    }
  }

  POINT_IN = {
    'type' => 'Feature',
    'geometry' => {
      'type' => 'Point',
      'coordinates' => [123.269691,9.305099]
    }
  }

  # x1,y1,x2,y2 (Lng1,Lat1,...)
  BBOX = '123.193645|9.256139|123.331833|9.364216'


  test 'should filter by distance' do

    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
    }

    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 6, data['issues'].size

    issue_in = @project.issues.find 1
    issue_in.update_attribute :geojson, POINT_IN.to_json

    issue_out = @project.issues.find 2
    issue_out.update_attribute :geojson, POINT_OUT.to_json

    # find everyting inside 1km radius
    # using the 'short' parameter format

    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
      distance: '<=1000|123.2696|9.3050',
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 1, data['issues'].size
    assert_equal issue_in.id, data['issues'][0]['id']
    assert dist = data['issues'][0]['distance'].to_i
    assert dist > 0
    assert dist < 1000


    # filter and sort by distance
    #
    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
      distance: '<=100000|123.2696|9.3050',
      sort: 'distance'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 2, data['issues'].size
    assert_equal issue_in.id, data['issues'][0]['id']
    assert_equal issue_out.id, data['issues'][1]['id']

    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
      distance: '<=100000|123.2696|9.3050',
      sort: 'distance:desc'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 2, data['issues'].size
    assert_equal issue_out.id, data['issues'][0]['id']
    assert_equal issue_in.id, data['issues'][1]['id']


    # find everyting outside 1km radius
    # this is using the url params as they come from the web ui just ot make
    # sure this works as well

    get '/projects/ecookbook/issues.json', params: {
      set_filter: 1,
      f: %w(status_id distance),
      op: { status_id: 'o', distance: '>=' },
      v:  { distance: ['1000', '123.2696', '9.3050'] }
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 1, data['issues'].size
    assert_equal issue_out.id, data['issues'][0]['id']


    # find everyting on the 1km radius
    # more of a theoretical use case...
    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
      distance: '=1000|123.2696|9.3050'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 0, data['issues'].size

    # find everyting with a distance between 10 and 1000m
    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o',
      distance: '><10|1000|123.2696|9.3050'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 1, data['issues'].size
    assert_equal issue_in.id, data['issues'][0]['id']

    # find everyting having any distance (finds anything with a geometry set)
    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o', distance: '*'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 2, data['issues'].size

    # find everyting having no distance (finds anything with no geometry set)
    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o', distance: '!*'
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 4, data['issues'].size
  end


  test 'should filter by bounding box' do

    get '/projects/ecookbook/issues.json', params: { status_id: 'o' }

    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 6, data['issues'].size

    issue_in = @project.issues.find 1
    issue_in.update_attribute :geojson, POINT_IN.to_json

    issue_out = @project.issues.find 2
    issue_out.update_attribute :geojson, POINT_OUT.to_json

    # find everyting inside the given box
    # using the shorter API parameter format

    get '/projects/ecookbook/issues.json', params: {
      status_id: 'o', bbox: "=#{BBOX}"
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 1, data['issues'].size
    assert_equal issue_in.id, data['issues'][0]['id']


    # find everyting *outside* the given box
    # using the parameter format used by the web UI

    get '/projects/ecookbook/issues.json', params: {
      set_filter: 1,
      f: %w(status_id bbox),
      op: { status_id: 'o', bbox: '!' },
      v:  { bbox: [BBOX] }
    }
    assert_response :success
    assert data = JSON.parse(response.body)
    assert_equal 1, data['issues'].size
    assert_equal issue_out.id, data['issues'][0]['id']
  end

end
