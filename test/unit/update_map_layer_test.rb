require_relative '../test_helper'

class UpdateMapLayerTest < ActiveSupport::TestCase

  test 'should update map layer' do
    ts = GttMapLayer.create! name: 'test', layer: 'Tile'
    r = RedmineGtt::Actions::UpdateMapLayer.(ts, name: 'new', source_options_string: '{ "url": "https://example.com"}')
    assert r.map_layer_updated?
    assert_equal 'new', r.map_layer.name
    assert_equal 'https://example.com', r.map_layer.source_options['url']
  end
end

