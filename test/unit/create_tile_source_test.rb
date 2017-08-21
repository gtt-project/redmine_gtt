require_relative '../test_helper'

class CreateTileSourceTest < ActiveSupport::TestCase

  test 'should create tile source' do
    r = RedmineGtt::Actions::CreateTileSource.(type: 'GttOsmTileSource', name: 'test', options: { url: 'https://example.com' })
    assert r.tile_source_created?
    assert_equal 'test', r.tile_source.name
    assert_equal 'https://example.com', r.tile_source.url
  end
end
