require_relative '../test_helper'

class IssueTest < GttTest
  fixtures :projects, :issues, :users

  setup do
    @project = Project.find 'ecookbook'
    @issue = @project.issues.last
    @issue.update_column :geom, test_geom
  end

  test 'should have geojson attribute' do
    assert_geojson @issue.geojson
  end

  test 'should render properties in as_geojson' do
    j = @issue.as_geojson include_properties: true
    assert_geojson j
    assert_equal @issue.id, j['properties']['id']
    assert_equal @issue.subject, j['properties']['subject']
    assert_equal @issue.author_id, j['properties']['author_id']
    assert_nil j['properties']['geom']

    j = @issue.as_geojson include_properties: { only: [:id, :subject] }
    assert_geojson j
    assert_equal @issue.id, j['properties']['id']
    assert_equal @issue.subject, j['properties']['subject']
    assert_nil j['properties']['author_id']
    assert_nil j['properties']['geom']
  end

  test 'should render array as geojson' do
    j = Issue.array_to_geojson [@issue]
    assert_geojson_collection j
  end


  test 'should have geojson scope' do
    assert_geojson_collection Issue.geojson
  end

end




