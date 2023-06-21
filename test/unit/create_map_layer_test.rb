require_relative '../test_helper'

class CreateMapLayerTest < ActiveSupport::TestCase

  test 'should create map layer' do
    r = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'test', source_options_string: '{ "url": "https://example.com" }')
    assert r.map_layer_created?
    assert_equal 'test', r.map_layer.name
    assert_equal 'https://example.com', r.map_layer.source_options['url']
  end

  test 'should validate json' do
    r = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'test', source_options_string: 'lolo{ "url": "https://example.com" }')

    refute r.map_layer_created?
    assert ts = r.map_layer
    assert ts.errors[:source_options_string].present?
    assert_equal 'lolo{ "url": "https://example.com" }', ts.source_options_string
  end
end
