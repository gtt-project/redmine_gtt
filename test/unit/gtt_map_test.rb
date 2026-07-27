require_relative '../test_helper'

class GttMapTest < GttTest

  setup do
    @ts = GttMapLayer.create! name: 'test', layer: 'Tile'
  end

  # test 'should compute json from geom' do
  #   m = GttMap.new layers: [@ts], geom: example_geom
  #   assert_geojson m.json
  # end
end



