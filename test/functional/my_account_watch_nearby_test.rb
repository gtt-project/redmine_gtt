require_relative '../test_helper'

# Exercises the My account rendering and round trip of the "auto watch
# nearby issues" preference (the view_my_account hook partial).
class MyAccountWatchNearbyTest < Redmine::ControllerTest
  tests MyController

  fixtures :users, :email_addresses, :user_preferences,
           :roles, :projects, :members, :member_roles, :enabled_modules,
           :trackers, :issue_statuses, :enumerations

  include GttTestData

  setup do
    @user = User.find_by_login 'dlopper'
    @request.session[:user_id] = @user.id
  end

  test 'renders the fieldset disabled while no location is stored' do
    get :account

    assert_response :success
    assert_select 'fieldset legend', text: I18n.t(:gtt_label_watch_nearby_legend)
    assert_select 'input#pref_gtt_watch_nearby[disabled=disabled]'
    assert_select 'input#pref_gtt_watch_radius[disabled=disabled]'
    assert_select 'em.info', text: I18n.t(:gtt_text_watch_nearby_requires_location)
    # no hidden '0' fallback while disabled, so saving other account settings
    # does not overwrite the stored preference
    assert_select 'input[type=hidden][name=?]', 'pref[gtt_watch_nearby]', count: 0
  end

  test 'saving other settings without a location leaves the preference untouched' do
    @user.pref.update(gtt_watch_nearby: '1', gtt_watch_radius: '25')

    put :account, params: { user: { firstname: 'Dave' }, pref: { no_self_notified: '1' } }

    assert_redirected_to '/my/account'
    pref = User.find(@user.id).pref
    assert pref.gtt_watch_nearby?
    assert_equal 25, pref.gtt_watch_radius_km
  end

  test 'renders the fieldset enabled once a location is stored' do
    @user.update_attribute :geojson, example_geojson

    get :account

    assert_response :success
    assert_select 'input#pref_gtt_watch_nearby:not([disabled])'
    assert_select 'input#pref_gtt_watch_radius:not([disabled])'
    assert_select 'em.info', text: I18n.t(:gtt_text_watch_nearby_requires_location), count: 0
  end

  test 'saves the preference from the account form' do
    @user.update_attribute :geojson, example_geojson

    put :account, params: {
      user: { firstname: @user.firstname },
      pref: { gtt_watch_nearby: '1', gtt_watch_radius: '25' }
    }

    assert_redirected_to '/my/account'
    pref = User.find(@user.id).pref
    assert pref.gtt_watch_nearby?
    assert_equal 25, pref.gtt_watch_radius_km
  end

  test 'unchecking the box turns the preference off' do
    @user.update_attribute :geojson, example_geojson
    @user.pref.update(gtt_watch_nearby: '1', gtt_watch_radius: '25')

    put :account, params: {
      user: { firstname: @user.firstname },
      pref: { gtt_watch_nearby: '0' }
    }

    assert_redirected_to '/my/account'
    pref = User.find(@user.id).pref
    assert_not pref.gtt_watch_nearby?
    # the radius survives so re-enabling does not lose the value
    assert_equal 25, pref.gtt_watch_radius_km
  end
end
