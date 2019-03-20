# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')

module GttTestData
  def test_geojson
    {'type'=>'Feature','geometry'=>{ 'type'=>'Polygon','coordinates'=> test_coordinates}}.to_json
  end

  def test_coordinates
    [[[135.220734222412,34.7056906000311],[135.302273376465,34.6990600142143],[135.300041778564,34.6709699843709],[135.252834899902,34.6760523038894],[135.194212539673,34.6766840435102],[135.220734222412,34.7056906000311]]]
  end

  def point_geojson(coordinates)
    {'type'=>'Feature','geometry'=>{ 'type'=>'Point','coordinates'=> coordinates}}.to_json
  end

  def test_geom
    RedmineGtt::Conversions::WkbToGeom.("01030000000100000006000000C84B374110E76040381DD011545A4140C84B3739ACE96040F07E6DCC7A594140C84B37F199E960403CBC2D58E2554140C84B373917E8604098CBC3E188564140C84B37FD36E66040F24C2E959D564140C84B374110E76040381DD011545A4140")
  end
end

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
