require File.expand_path('../../test_helper', __FILE__)

class TrackerIconTest < ActiveSupport::TestCase
  CLEAN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/></svg>'

  def test_sanitize_keeps_static_vector_content
    result = RedmineGtt::SvgSanitizer.sanitize(CLEAN_SVG)
    assert_includes result, '<path'
    assert_includes result, 'viewBox="0 0 24 24"'
  end

  def test_sanitize_strips_scripts_and_event_handlers
    dirty = '<svg viewBox="0 0 24 24" onload="alert(1)">' \
            '<script>alert(1)</script>' \
            '<path d="M0 0h24v24z" onclick="alert(1)"/>' \
            '<foreignObject><body>x</body></foreignObject>' \
            '</svg>'
    result = RedmineGtt::SvgSanitizer.sanitize(dirty)
    refute_includes result, 'script'
    refute_includes result, 'onload'
    refute_includes result, 'onclick'
    refute_includes result, 'foreignObject'
    assert_includes result, '<path'
  end

  def test_sanitize_strips_external_references
    dirty = '<svg viewBox="0 0 24 24">' \
            '<use xlink:href="https://evil.example/x.svg#i" xmlns:xlink="http://www.w3.org/1999/xlink"/>' \
            '<path d="M0 0z" fill="url(#gradient)"/>' \
            '<image href="https://evil.example/x.png"/>' \
            '</svg>'
    result = RedmineGtt::SvgSanitizer.sanitize(dirty)
    refute_includes result, 'evil.example'
    refute_includes result, 'url('
    refute_includes result, '<image'
    refute_includes result, '<use'
  end

  def test_sanitize_rejects_non_svg
    assert_nil RedmineGtt::SvgSanitizer.sanitize('<div>not svg</div>')
    assert_nil RedmineGtt::SvgSanitizer.sanitize('plain text')
    assert_nil RedmineGtt::SvgSanitizer.sanitize('')
    assert_nil RedmineGtt::SvgSanitizer.sanitize(nil)
  end

  def test_sanitize_does_not_expand_entities
    bomb = '<?xml version="1.0"?>' \
           '<!DOCTYPE svg [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>' \
           '<svg viewBox="0 0 24 24"><title>&b;</title><path d="M0 0z"/></svg>'
    result = RedmineGtt::SvgSanitizer.sanitize(bomb)
    # Entities stay unexpanded; the repeated payload must not appear.
    refute_includes result.to_s, 'aaaaaaaaaa'
    assert_includes result.to_s, '<path'
  end

  def test_normalize_passes_legacy_glyph_names_through
    assert_equal 'lobsta', RedmineGtt::TrackerIcon.normalize('lobsta')
    assert_equal 'mdi-home', RedmineGtt::TrackerIcon.normalize('mdi-home')
  end

  def test_normalize_sanitizes_icon_json
    value = { 'id' => 'mdi:home', 'svg' => CLEAN_SVG }.to_json
    result = JSON.parse(RedmineGtt::TrackerIcon.normalize(value))
    assert_equal 'mdi:home', result['id']
    assert_includes result['svg'], '<path'
  end

  def test_normalize_empties_icon_json_without_usable_svg
    value = { 'id' => 'x', 'svg' => '<div>nope</div>' }.to_json
    assert_equal '', RedmineGtt::TrackerIcon.normalize(value)
  end

  def test_plugin_setting_writes_are_sanitized
    original = Setting.plugin_redmine_gtt
    dirty_svg = '<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0z"/></svg>'
    Setting.plugin_redmine_gtt = original.merge(
      'tracker_1' => { 'id' => 'mdi:x', 'svg' => dirty_svg }.to_json
    )
    stored = JSON.parse(Setting.plugin_redmine_gtt['tracker_1'])
    refute_includes stored['svg'], 'script'
    assert_includes stored['svg'], '<path'
  ensure
    Setting.plugin_redmine_gtt = original
  end
end
