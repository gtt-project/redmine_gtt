require_relative '../test_helper'

class DistanceUnitTest < GttTest

  teardown do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'm', 'api_distance_unit' => 'm'
    )
  end

  test 'defaults to meters' do
    assert_equal 'm', RedmineGtt::DistanceUnit.current
    assert_equal 'm', RedmineGtt::DistanceUnit.api_unit
  end

  test 'falls back to meters for unknown units' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'parsec'
    )
    assert_equal 'm', RedmineGtt::DistanceUnit.current
  end

  test 'reads the configured display unit' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'km'
    )
    assert_equal 'km', RedmineGtt::DistanceUnit.current
  end

  test 'api unit is clamped to meters regardless of the stored value' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'api_distance_unit' => 'km'
    )
    assert_equal 'm', RedmineGtt::DistanceUnit.api_unit
  end

  test 'converts from meters into the given unit' do
    assert_equal 1.5, RedmineGtt::DistanceUnit.from_meters(1500, 'km')
    assert_in_delta 0.932, RedmineGtt::DistanceUnit.from_meters(1500, 'mi'), 0.001
    assert_in_delta 4921.26, RedmineGtt::DistanceUnit.from_meters(1500, 'ft'), 0.01
    assert_in_delta 0.81, RedmineGtt::DistanceUnit.from_meters(1500, 'nm'), 0.001
    assert_equal 1500.0, RedmineGtt::DistanceUnit.from_meters(1500, 'm')
  end

  test 'converts a unit value into meters' do
    assert_equal 1500.0, RedmineGtt::DistanceUnit.to_meters(1.5, 'km')
    assert_in_delta 1609.344, RedmineGtt::DistanceUnit.to_meters(1, 'mi'), 0.001
    assert_equal 25.0, RedmineGtt::DistanceUnit.to_meters(25, 'm')
  end

  test 'conversions honor the configured unit by default' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'km'
    )
    assert_equal 2.0, RedmineGtt::DistanceUnit.from_meters(2000)
    assert_equal 2000.0, RedmineGtt::DistanceUnit.to_meters(2)
  end

  test 'distance column caption carries the unit' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'mi'
    )
    column = IssueQuery.new.available_columns.detect { |c| c.name == :distance }
    assert column, 'distance column should be available on global queries'
    assert_match(/\(mi\)\z/, column.caption)
  end
end
