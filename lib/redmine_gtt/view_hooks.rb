module RedmineGtt
  class ViewHooks < Redmine::Hook::ViewListener
    render_on :view_account_left_bottom,
      partial: 'redmine_gtt/hooks/view_account_left_bottom'
  end
end
