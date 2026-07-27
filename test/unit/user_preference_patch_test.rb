require_relative '../test_helper'

class UserPreferencePatchTest < GttTest
  fixtures :users

  setup do
    @pref = User.find_by_login('dlopper').pref
  end

  teardown do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'm'
    )
  end

  test 'preference is off by default' do
    assert_not @pref.gtt_watch_nearby?
    assert_nil @pref.gtt_watch_radius_m
  end

  test 'accessors persist through the serialized others hash' do
    @pref.gtt_watch_nearby = '1'
    @pref.gtt_watch_radius = '25000'
    assert @pref.save

    pref = User.find_by_login('dlopper').pref
    assert pref.gtt_watch_nearby?
    assert_equal 25_000, pref.gtt_watch_radius_m
  end

  test 'safe_attributes mass-assignment works for the form keys' do
    @pref.safe_attributes = {
      'gtt_watch_nearby' => '1', 'gtt_watch_radius_in_unit' => '10'
    }
    assert @pref.save

    pref = User.find_by_login('dlopper').pref
    assert pref.gtt_watch_nearby?
    assert_equal 10, pref.gtt_watch_radius_m
  end

  test 'the raw radius is not mass-assignable' do
    @pref.safe_attributes = { 'gtt_watch_radius' => '123' }
    assert_nil @pref.gtt_watch_radius_m
  end

  test 'gtt_watch_nearby? treats anything but "1" as off' do
    ['0', '', nil, 'true'].each do |value|
      @pref.gtt_watch_nearby = value
      assert_not @pref.gtt_watch_nearby?, "expected #{value.inspect} to be off"
    end
  end

  test 'gtt_watch_radius_m rejects blank, non-numeric and non-positive values' do
    [nil, '', 'abc', '0', '-5'].each do |value|
      @pref.gtt_watch_radius = value
      assert_nil @pref.gtt_watch_radius_m, "expected #{value.inspect} to be nil"
    end
  end

  test 'gtt_watch_radius_m caps the radius server-side' do
    @pref.gtt_watch_radius = '99999999'
    assert_equal RedmineGtt::Patches::UserPreferencePatch::NEARBY_WATCH_MAX_RADIUS_M,
      @pref.gtt_watch_radius_m
  end

  test 'the form attribute converts through the configured display unit' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'km'
    )
    @pref.gtt_watch_radius_in_unit = '25'
    assert_equal 25_000, @pref.gtt_watch_radius_m
    assert_equal 25, @pref.gtt_watch_radius_in_unit

    @pref.gtt_watch_radius_in_unit = '0.5'
    assert_equal 500, @pref.gtt_watch_radius_m
    assert_equal 0.5, @pref.gtt_watch_radius_in_unit
  end

  test 'a read-save round trip does not drift the stored meters' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'mi'
    )
    @pref.gtt_watch_radius = '500' # meters, not a round mile value
    displayed = @pref.gtt_watch_radius_in_unit
    @pref.gtt_watch_radius_in_unit = displayed.to_s
    assert_equal 500, @pref.gtt_watch_radius_m
  end

  test 'the form attribute keeps garbage rejected and blank clearing' do
    @pref.gtt_watch_radius_in_unit = 'abc'
    assert_nil @pref.gtt_watch_radius_m

    @pref.gtt_watch_radius_in_unit = ' '
    assert_nil @pref.gtt_watch_radius
  end
end
