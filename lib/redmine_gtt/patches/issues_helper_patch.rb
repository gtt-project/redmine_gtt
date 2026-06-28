module RedmineGtt
  module Patches

    # Rounds the WKT shown for geometry changes in the issue history to the
    # configured precision. #show_detail is the shared rendering path for the
    # history page, the notification emails, and the PDF export, so all three
    # display the shortened coordinates. Display only: the geom column and the
    # journal record keep their full precision.
    module IssuesHelperPatch

      def self.apply
        IssuesHelper.prepend self unless IssuesHelper < self
      end

      def show_detail(detail, no_html = false, options = {})
        if detail.property == 'attr' && detail.prop_key == 'geom'
          detail = detail.dup
          detail.value = RedmineGtt.round_wkt(detail.value)
          detail.old_value = RedmineGtt.round_wkt(detail.old_value)
        end
        super
      end

    end

  end
end
