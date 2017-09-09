require_relative '../test_helper'

class UpdateTileSourceTest < ActiveSupport::TestCase

  test 'should update tile source' do
    ts = GttTileSource.create! name: 'test', type: 'ol.source.OSM'
    r = RedmineGtt::Actions::UpdateTileSource.(ts, name: 'new', options_string: '{ "url": "https://example.com"}')
    assert r.tile_source_updated?
    assert_equal 'new', r.tile_source.name
    assert_equal 'https://example.com', r.tile_source.options['url']
  end
end

