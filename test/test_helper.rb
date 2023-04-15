# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')

module GttTestData
  def test_geojson
    {'type'=>'Feature','geometry'=>{ 'type'=>'Polygon','coordinates'=> test_coordinates}}.to_json
  end

  def test_coordinates
    # [[[135.220734222,34.705690600],[135.302273376,34.699060014],[135.300041779,34.670969984],[135.252834900,34.676052304],[135.194212540,34.676684044],[135.220734222,34.705690600]]]
    [[[135.220734222,34.705690600,0.0],[135.302273376,34.699060014,0.0],[135.300041779,34.670969984,0.0],[135.252834900,34.676052304,0.0],[135.194212540,34.676684044,0.0],[135.220734222,34.705690600,0.0]]]
  end

  def point_geojson(coordinates)
    {'type'=>'Feature','geometry'=>{ 'type'=>'Point','coordinates'=> coordinates}}.to_json
  end

  def linestring_geojson(coordinates)
    {'type'=>'Feature','geometry'=>{ 'type'=>'LineString','coordinates'=> coordinates}}.to_json
  end

  def polygon_geojson(coordinates)
    {'type'=>'Feature','geometry'=>{ 'type'=>'Polygon','coordinates'=> coordinates}}.to_json
  end

  def multipolygon_geojson(coordinates)
    {'type'=>'Feature','geometry'=>{ 'type'=>'MultiPolygon','coordinates'=> coordinates}}.to_json
  end

  def test_geom
    RedmineGtt::Conversions::WkbToGeom.("01030000000100000006000000C84B374110E76040381DD011545A4140C84B3739ACE96040F07E6DCC7A594140C84B37F199E960403CBC2D58E2554140C84B373917E8604098CBC3E188564140C84B37FD36E66040F24C2E959D564140C84B374110E76040381DD011545A4140")
  end
end

\x01eb0300000100000006000000c84b374110e76040381dd011545a41400000000000000000c84b3739ace96040f07e6dcc7a5941400000000000000000c84b37f199e960403cbc2d58e25541400000000000000000c84b373917e8604098cbc3e1885641400000000000000000c84b37fd36e66040f24c2e959d5641400000000000000000c84b374110e76040381dd011545a41400000000000000000

class GttTest < ActiveSupport::TestCase
  include GttTestData

  def assert_geojson(json)
    json = JSON.parse json if json.is_a?(String)
    assert_equal 'Feature', json['type']
    assert geom = json['geometry']
    assert_equal 'Polygon', geom['type']
    assert_equal_coordinates test_coordinates, geom['coordinates']
  end

  def assert_equal_coordinates(a, b)
    assert_equal a.flatten.map{|f|f.round 5}, b.flatten.map{|f|f.round 5}
  end

  def assert_geojson_collection(json)
    assert_equal 'FeatureCollection', json['type']
    assert_equal 1, json['features'].size
    assert_geojson json['features'][0]
  end
end
