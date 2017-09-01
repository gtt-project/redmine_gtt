require_relative '../test_helper'

class CreateTileSourceTest < ActiveSupport::TestCase

  test 'should create tile source' do
    r = RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'test', options_string: '{ "url": "https://example.com" }')
    assert r.tile_source_created?
    assert_equal 'test', r.tile_source.name
    assert_equal 'https://example.com', r.tile_source.options['url']
  end

  test 'should validate json' do
    r = RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'test', options_string: 'lolo{ "url": "https://example.com" }')

    refute r.tile_source_created?
    assert ts = r.tile_source
    assert ts.errors[:options_string].present?
    assert_equal 'lolo{ "url": "https://example.com" }', ts.options_string
  end
end
