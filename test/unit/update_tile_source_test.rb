require_relative '../test_helper'

class UpdateTileSourceTest < ActiveSupport::TestCase

  test 'should update tile source' do
    ts = GttOsmTileSource.create! name: 'test'
    r = RedmineGtt::Actions::UpdateTileSource.(ts, name: 'new', url: 'https://example.com')
    assert r.tile_source_updated?
    assert_equal 'new', r.tile_source.name
    assert_equal 'https://example.com', r.tile_source.url
  end
end

