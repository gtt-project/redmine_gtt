require_relative '../test_helper'

class IssueTest < GttTest
  fixtures :projects, :issues, :users

  setup do
    @project = Project.find 'ecookbook'
    @issue = @project.issues.last
    @issue.update_attribute :geojson, test_geojson
    @issue = Issue.find @issue.id
  end

  test 'should have geom attribute' do
    assert @issue.geom.present?
  end

  test 'should load geojson' do
    @issue = Issue.find @issue.id
    assert j = @issue.geojson
    assert j.present?
    @issue.instance_variable_set "@geojson", nil
    Issue.load_geojson [@issue]
    assert_equal j, @issue.instance_variable_get("@geojson")
    assert_equal j, @issue.geojson
  end

  test 'should have geojson attribute' do
    assert_geojson @issue.geojson
  end

  test 'should have geojson for print' do
    assert d = @issue.geodata_for_print
    assert center = d[:center]
    assert_equal 2, center.size
    assert geom = d[:geojson]['geometry']
    assert coords = geom['coordinates']
    assert_equal 15052703.278285623, coords.flatten.first
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

  test 'should ignore small point geom changes' do
    coordinates = [135.220734222412, 34.7056906000311]

    @issue.update_attribute :geojson, point_geojson(coordinates)
    @issue.instance_variable_set "@geojson", nil
    old_coordinates = @issue.geojson["geometry"]["coordinates"]

    new_coordinates = old_coordinates.map{|c| c + 0.000000001}
    @issue.update_attribute :geojson, point_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal old_coordinates, @issue.geojson["geometry"]["coordinates"]

    new_coordinates = [old_coordinates[0] + 0.2, old_coordinates[1]]
    @issue.update_attribute :geojson, point_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal new_coordinates, @issue.geojson["geometry"]["coordinates"]
  end

  test 'should ignore small linestring geom changes' do
    coordinates = test_coordinates[0]

    @issue.update_attribute :geojson, linestring_geojson(coordinates)
    @issue.instance_variable_set "@geojson", nil
    old_coordinates = @issue.geojson["geometry"]["coordinates"]

    new_coordinates = old_coordinates.map{|c| [c[0] + 0.000000001, c[1] + 0.000000001]}
    @issue.update_attribute :geojson, linestring_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal old_coordinates, @issue.geojson["geometry"]["coordinates"]

    new_coordinates = old_coordinates.map{|c| [c[0] + 0.2, c[1]]}
    @issue.update_attribute :geojson, linestring_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal new_coordinates, @issue.geojson["geometry"]["coordinates"]

    new_coordinates = old_coordinates.map{|c| [c[0], c[1]]}
    new_coordinates.delete_at(1)
    @issue.update_attribute :geojson, linestring_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal new_coordinates, @issue.geojson["geometry"]["coordinates"]
  end

  test 'should ignore small polygon geom changes' do
    coordinates = test_coordinates

    @issue.update_attribute :geojson, polygon_geojson(coordinates)
    @issue.instance_variable_set "@geojson", nil
    old_coordinates = @issue.geojson["geometry"]["coordinates"]

    new_coordinates = [old_coordinates[0].map{|c| [c[0] + 0.000000001, c[1] + 0.000000001]}]
    @issue.update_attribute :geojson, polygon_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal old_coordinates, @issue.geojson["geometry"]["coordinates"]

    new_coordinates = [old_coordinates[0].map{|c| [c[0] + 0.2, c[1]]}]
    @issue.update_attribute :geojson, polygon_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal new_coordinates, @issue.geojson["geometry"]["coordinates"]

    new_coordinates = [old_coordinates[0].map{|c| [c[0], c[1]]}]
    new_coordinates[0].delete_at(1)
    @issue.update_attribute :geojson, polygon_geojson(new_coordinates)
    @issue.instance_variable_set "@geojson", nil
    assert_equal new_coordinates, @issue.geojson["geometry"]["coordinates"]
  end
end
