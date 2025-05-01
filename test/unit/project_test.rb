require_relative '../test_helper'

class ProjectTest < GttTest
  fixtures :projects

  setup do
    @p = Project.find 'ecookbook'
    @p.update_attribute :geojson, example_geojson
  end

  test 'should have geojson and geom attribute' do
    assert @p.geom.present?
    assert_geojson @p.geojson
  end

  test 'should render properties in as_geojson' do
    j = @p.as_geojson include_properties: true
    assert_geojson j
    assert_equal @p.id, j['properties']['id']
    assert_equal @p.identifier, j['properties']['identifier']
    assert_equal @p.name, j['properties']['name']

    j = @p.as_geojson include_properties: { only: [:id, :identifier] }
    assert_geojson j
    assert_equal @p.id, j['properties']['id']
    assert_equal @p.identifier, j['properties']['identifier']
    assert_nil j['properties']['name']
  end

end



