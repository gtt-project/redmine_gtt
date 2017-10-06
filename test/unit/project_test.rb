require_relative '../test_helper'

class ProjectTest < GttTest
  fixtures :projects

  test 'should have geojson attribute' do
    p = Project.find 'ecookbook'
    p.update_column :geom, test_geom

    assert_geojson p.geojson
  end

  test 'should render properties in as_geojson' do
    p = Project.find 'ecookbook'
    p.update_column :geom, test_geom

    j = p.as_geojson include_properties: true
    assert_geojson j
    assert_equal p.id, j['properties']['id']
    assert_equal p.identifier, j['properties']['identifier']
    assert_equal p.name, j['properties']['name']

    j = p.as_geojson include_properties: { only: [:id, :identifier] }
    assert_geojson j
    assert_equal p.id, j['properties']['id']
    assert_equal p.identifier, j['properties']['identifier']
    assert_nil j['properties']['name']
  end

end



