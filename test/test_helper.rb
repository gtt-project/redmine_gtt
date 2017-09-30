# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')

class GttTest < ActiveSupport::TestCase

  def test_wkb
    "01030000000100000006000000C84B374110E76040381DD011545A4140C84B3739ACE96040F07E6DCC7A594140C84B37F199E960403CBC2D58E2554140C84B373917E8604098CBC3E188564140C84B37FD36E66040F24C2E959D564140C84B374110E76040381DD011545A4140"
  end

  def assert_geojson(json)
    assert_equal 'Feature', json['type']
    assert geom = json['geometry']
    assert_equal 'Polygon', geom['type']
    assert_equal [[[135.22073422241215,34.70569060003112],[135.30227337646488,34.6990600142143],[135.3000417785645,34.670969984370885],[135.25283489990238,34.676052303889435],[135.1942125396729,34.67668404351015],[135.22073422241215,34.70569060003112]]], geom['coordinates']
  end

  def assert_geojson_collection(json)
    assert_equal 'FeatureCollection', json['type']
    assert_equal 1, json['features'].size
    assert_geojson json['features'][0]
  end
end
