import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        roles: { include: { permissions: true } },
        members: { include: { user: true } }
      }
    });

    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    // SPECIAL LOGIC FOR NEXUS CORE
    if (org.slug === "nexus-core") {
        const allUsers = await prisma.user.findMany({
            include: { userRole: true }
        });

        const superAdmins = allUsers.filter(u => u.userRole?.name === "Super Admin");
        const admins = allUsers.filter(u => u.userRole?.name === "Admin");
        const regularUsers = allUsers.filter(u => u.userRole?.name !== "Super Admin" && u.userRole?.name !== "Admin");

        const structure: any = {
            id: org.id,
            name: org.name,
            type: "org",
            children: []
        };

        // 1. Super Admins at top
        superAdmins.forEach(sa => {
            const saNode = {
                id: sa.id,
                name: sa.name || sa.email,
                type: "user",
                children: [] as any[]
            };
            structure.children.push(saNode);
        });

        // 2. Divide Admins among Super Admins
        if (structure.children.length > 0) {
            admins.forEach((admin, index) => {
                const parent = structure.children[index % structure.children.length];
                parent.children.push({
                    id: admin.id,
                    name: admin.name || admin.email,
                    type: "user",
                    children: []
                });
            });
        } else {
            // No Super Admins? Put Admins at top
            admins.forEach(admin => {
                structure.children.push({
                    id: admin.id,
                    name: admin.name || admin.email,
                    type: "user",
                    children: []
                });
            });
        }

        // 3. Divide Users among lowest Admins
        // We need a list of all "leaf" admins (those who are admins or superAdmins if no admins)
        const leafAdmins: any[] = [];
        const findLeafAdmins = (nodes: any[]) => {
            nodes.forEach(n => {
                if (n.type === "user") {
                    // Check if this user is an admin or superAdmin
                    const user = allUsers.find(u => u.id === n.id);
                    if (user?.userRole?.name === "Admin" || (user?.userRole?.name === "Super Admin" && admins.length === 0)) {
                        leafAdmins.push(n);
                    }
                }
                if (n.children) findLeafAdmins(n.children);
            });
        };
        findLeafAdmins(structure.children);

        if (leafAdmins.length > 0) {
            regularUsers.forEach((user, index) => {
                const parent = leafAdmins[index % leafAdmins.length];
                parent.children.push({
                    id: user.id,
                    name: user.name || user.email,
                    type: "user"
                });
            });
        } else if (structure.children.length === 0) {
            // No hierarchy? Put everyone at top
            regularUsers.forEach(user => {
                structure.children.push({
                    id: user.id,
                    name: user.name || user.email,
                    type: "user"
                });
            });
        }

        return NextResponse.json({ structure });
    }

    // Default hierarchy for other orgs
    const structure: any = {
      id: org.id,
      name: org.name,
      type: "org",
      children: []
    };

    org.roles.forEach(role => {
      const roleNode: any = {
        id: role.id,
        name: role.name,
        type: "role",
        children: []
      };

      const members = org.members.filter(m => m.roleId === role.id);
      members.forEach(m => {
        roleNode.children.push({
          id: m.userId,
          name: m.user.name || m.user.email,
          type: "user"
        });
      });

      structure.children.push(roleNode);
    });

    return NextResponse.json({ structure });
  } catch (error) {
    console.error("STRUCTURE_ERROR", error);
    return NextResponse.json({ error: "Failed to compute structure" }, { status: 500 });
  }
}