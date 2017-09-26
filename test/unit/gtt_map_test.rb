require_relative '../test_helper'

class GttMapTest < GttTest

  setup do
    @ts = GttTileSource.create! name: 'test', type: 'ol.source.OSM'
  end

  test 'should compute json from wkb' do
    m = GttMap.new layers: [@ts], wkb: test_wkb
    assert_geojson m.json
  end
end



